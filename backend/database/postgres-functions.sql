-- ThriftLink — Postgres functions + type fixups required by the supabase-js cutover.
-- Run this ONCE in the Supabase SQL Editor (after postgres-schema.sql).
--
-- The existing Supabase tables use uuid id/fk columns and boolean flag columns
-- (is_active, is_verified, is_read, is_approved, ...). The is_featured column,
-- added later, came in as integer — this block normalizes it to boolean so it
-- matches every other flag and the app's boolean<->int mapping layer.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'vendor_profiles' and column_name = 'is_featured'
      and data_type <> 'boolean'
  ) then
    alter table vendor_profiles alter column is_featured drop default;
    alter table vendor_profiles
      alter column is_featured type boolean
      using (case when is_featured::int <> 0 then true else false end);
    alter table vendor_profiles alter column is_featured set default false;
    alter table vendor_profiles alter column is_featured set not null;
  end if;
end $$;

-- place_order: atomic checkout (one order per vendor in the cart, order_items,
-- stock decrement, vendor notifications, cart clear). Returns created order ids.
--
-- p_payload shape:
--   { "shippingAddress","phone","notes","paymentMethod",
--     "items":[{"product_id","vendor_id","price","quantity"}, ...] }
create or replace function place_order(p_user_id text, p_payload jsonb)
returns text[]
language plpgsql
security definer
as $$
declare
  v_user_id uuid := p_user_id::uuid;
  v_vendor_id text;
  v_order_id uuid;
  v_order_total double precision;
  v_item jsonb;
  v_order_ids text[] := array[]::text[];
begin
  for v_vendor_id in
    select distinct (jsonb_array_elements(p_payload->'items')->>'vendor_id')
  loop
    v_order_id := gen_random_uuid();
    select coalesce(sum((item->>'price')::double precision * (item->>'quantity')::int), 0)
      into v_order_total
      from jsonb_array_elements(p_payload->'items') item
      where item->>'vendor_id' = v_vendor_id;

    insert into orders (id, user_id, vendor_id, total_amount, shipping_address, phone, notes, payment_method, status, payment_status)
    values (
      v_order_id, v_user_id, v_vendor_id::uuid, v_order_total,
      p_payload->>'shippingAddress', p_payload->>'phone', p_payload->>'notes',
      p_payload->>'paymentMethod', 'pending', 'pending'
    );

    for v_item in
      select item from jsonb_array_elements(p_payload->'items') item
      where item->>'vendor_id' = v_vendor_id
    loop
      insert into order_items (id, order_id, product_id, quantity, price_at_purchase)
      values (
        gen_random_uuid(), v_order_id,
        (v_item->>'product_id')::uuid,
        (v_item->>'quantity')::int,
        (v_item->>'price')::double precision
      );

      update products
        set stock_quantity = greatest(0, stock_quantity - (v_item->>'quantity')::int),
            updated_at = now()
        where id = (v_item->>'product_id')::uuid;
    end loop;

    insert into notifications (id, user_id, type, title, message, link)
    select
      gen_random_uuid(),
      vp.user_id,
      'order_update',
      'New Order Received',
      format('You have a new order (#%s) for ₦%s', substr(v_order_id::text, 1, 8), to_char(v_order_total, 'FM999,999,999.00')),
      '/vendor/orders'
    from vendor_profiles vp where vp.id = v_vendor_id::uuid;

    v_order_ids := array_append(v_order_ids, v_order_id::text);
  end loop;

  delete from cart_items where user_id = v_user_id;

  return v_order_ids;
end
$$;

-- conversation_list: chat partner list with last message + unread count.
create or replace function conversation_list(p_user_id text)
returns table (
  partner_id uuid,
  partner_name text,
  partner_avatar text,
  partner_last_seen timestamptz,
  last_message text,
  last_image text,
  last_message_time timestamptz,
  unread_count bigint
)
language sql
stable
as $$
  with me as (select p_user_id::uuid as uid),
  conv as (
    select
      case when sender_id = (select uid from me) then receiver_id else sender_id end as partner,
      max(created_at) as last_at
    from messages
    where sender_id = (select uid from me) or receiver_id = (select uid from me)
    group by 1
  ),
  latest as (
    select distinct on (
      case when m.sender_id = (select uid from me) then m.receiver_id else m.sender_id end
    )
      case when m.sender_id = (select uid from me) then m.receiver_id else m.sender_id end as partner,
      m.content as last_message,
      m.image_url as last_image,
      m.created_at as last_message_time
    from messages m
    where m.sender_id = (select uid from me) or m.receiver_id = (select uid from me)
    order by 1, m.created_at desc
  ),
  unread as (
    select sender_id as partner, count(*) as unread_count
    from messages
    where receiver_id = (select uid from me) and is_read = false
    group by 1
  )
  select
    u.id as partner_id,
    u.name as partner_name,
    u.avatar as partner_avatar,
    u.last_seen_at as partner_last_seen,
    l.last_message,
    l.last_image,
    l.last_message_time,
    coalesce(unread.unread_count, 0) as unread_count
  from conv c
  join users u on u.id = c.partner
  left join latest l on l.partner = c.partner
  left join unread on unread.partner = c.partner
  order by c.last_at desc;
$$;

-- vendor_stats: admin dashboard counters.
create or replace function vendor_stats()
returns table (
  total_vendors bigint,
  pending_verifications bigint,
  total_users bigint,
  total_products bigint,
  total_reviews bigint,
  pending_reviews bigint,
  total_orders bigint
)
language sql
stable
as $$
  select
    (select count(*) from vendor_profiles),
    (select count(*) from vendor_profiles where verification_status = 'pending'),
    (select count(*) from users where role = 'user'),
    (select count(*) from products),
    (select count(*) from reviews),
    (select count(*) from reviews where is_approved = false),
    (select count(*) from orders);
$$;
