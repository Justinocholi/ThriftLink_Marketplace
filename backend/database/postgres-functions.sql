-- ThriftLink — Postgres functions required by the supabase-js cutover.
-- Run this ONCE in the Supabase SQL Editor (after postgres-schema.sql).

-- place_order: atomic checkout (creates one order per vendor in the cart,
-- inserts order_items, decrements product stock, creates vendor notifications,
-- and clears the user's cart). Returns the array of created order ids.
--
-- p_payload shape:
--   {
--     "shippingAddress": "...",
--     "phone": "...",
--     "notes": "...",
--     "paymentMethod": "bank_transfer",
--     "items": [
--       {"product_id":"...", "vendor_id":"...", "price":1234, "quantity":1},
--       ...
--     ]
--   }
create or replace function place_order(p_user_id text, p_payload jsonb)
returns text[]
language plpgsql
security definer
as $$
declare
  v_vendor_id text;
  v_order_id text;
  v_order_total double precision;
  v_item jsonb;
  v_buyer_name text;
  v_order_ids text[] := array[]::text[];
begin
  select name into v_buyer_name from users where id = p_user_id;

  -- Group by vendor_id, one order per vendor.
  for v_vendor_id in
    select distinct (jsonb_array_elements(p_payload->'items')->>'vendor_id')
  loop
    v_order_id := gen_random_uuid()::text;
    select coalesce(sum((item->>'price')::double precision * (item->>'quantity')::int), 0)
      into v_order_total
      from jsonb_array_elements(p_payload->'items') item
      where item->>'vendor_id' = v_vendor_id;

    insert into orders (id, user_id, vendor_id, total_amount, shipping_address, phone, notes, payment_method, status, payment_status)
    values (
      v_order_id, p_user_id, v_vendor_id, v_order_total,
      p_payload->>'shippingAddress', p_payload->>'phone', p_payload->>'notes',
      p_payload->>'paymentMethod', 'pending', 'pending'
    );

    -- Items + stock decrement
    for v_item in
      select item from jsonb_array_elements(p_payload->'items') item
      where item->>'vendor_id' = v_vendor_id
    loop
      insert into order_items (id, order_id, product_id, quantity, price_at_purchase)
      values (
        gen_random_uuid()::text, v_order_id,
        v_item->>'product_id',
        (v_item->>'quantity')::int,
        (v_item->>'price')::double precision
      );

      update products
        set stock_quantity = greatest(0, stock_quantity - (v_item->>'quantity')::int),
            updated_at = now()
        where id = v_item->>'product_id';
    end loop;

    -- Vendor notification
    insert into notifications (id, user_id, type, title, message, link)
    select
      gen_random_uuid()::text,
      vp.user_id,
      'order_update',
      'New Order Received',
      format('You have a new order (#%s) for ₦%s', substr(v_order_id, 1, 8), to_char(v_order_total, 'FM999,999,999.00')),
      '/vendor/orders'
    from vendor_profiles vp where vp.id = v_vendor_id;

    v_order_ids := array_append(v_order_ids, v_order_id);
  end loop;

  -- Clear the buyer's cart
  delete from cart_items where user_id = p_user_id;

  return v_order_ids;
end
$$;

-- conversation_list: returns the user's chat partners with last message + unread count.
-- Replaces the GROUP BY query in routes/messages.js which PostgREST can't do.
create or replace function conversation_list(p_user_id text)
returns table (
  partner_id text,
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
  with conv as (
    select
      case when sender_id = p_user_id then receiver_id else sender_id end as partner,
      max(created_at) as last_at
    from messages
    where sender_id = p_user_id or receiver_id = p_user_id
    group by 1
  ),
  latest as (
    select distinct on (
      case when m.sender_id = p_user_id then m.receiver_id else m.sender_id end
    )
      case when m.sender_id = p_user_id then m.receiver_id else m.sender_id end as partner,
      m.content as last_message,
      m.image_url as last_image,
      m.created_at as last_message_time
    from messages m
    where m.sender_id = p_user_id or m.receiver_id = p_user_id
    order by 1, m.created_at desc
  ),
  unread as (
    select sender_id as partner, count(*) as unread_count
    from messages
    where receiver_id = p_user_id and is_read = 0
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

-- vendor_stats: returns the dashboard counters used by admin/stats.
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
    (select count(*) from reviews where is_approved = 0),
    (select count(*) from orders);
$$;
