// Formats a list of cart items for a single vendor into a WhatsApp message.
// Returns the encoded wa.me URL to open WhatsApp, or null if no phone available.
export function buildVendorOrderMessage({
  vendorName,
  vendorWhatsapp,
  items,
  buyerName,
  deliveryAddress,
  deliveryNotes,
}) {
  const lines = [];
  lines.push(`Hi ${vendorName || 'there'}, I'd like to order the following from ThriftLink:`);
  lines.push('');
  items.forEach((it, i) => {
    const qty = it.quantity || 1;
    const subtotal = (Number(it.price) || 0) * qty;
    const title = it.title || it.name || 'Item';
    lines.push(`${i + 1}. ${title} × ${qty} — ₦${subtotal.toLocaleString()}`);
  });
  const total = items.reduce(
    (s, it) => s + (Number(it.price) || 0) * (it.quantity || 1),
    0
  );
  lines.push('');
  lines.push(`*Total: ₦${total.toLocaleString()}*`);
  if (buyerName) lines.push(`\nName: ${buyerName}`);
  if (deliveryAddress) lines.push(`Delivery address: ${deliveryAddress}`);
  if (deliveryNotes) lines.push(`Notes: ${deliveryNotes}`);
  lines.push('\n— Sent from ThriftLink');
  const text = encodeURIComponent(lines.join('\n'));
  // Strip non-digits and normalize to international format (Nigeria default).
  let phone = String(vendorWhatsapp || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '234' + phone.slice(1);
  return phone ? `https://wa.me/${phone}?text=${text}` : null;
}

// Groups an array of cart items by vendor_id. Each group keeps the vendor
// display name + whatsapp number copied from the first item that has them.
export function groupCartByVendor(cartItems) {
  const groups = new Map();
  for (const it of cartItems || []) {
    const key = it.vendor_id || it.vendorId || it.shop_name || 'unknown';
    if (!groups.has(key)) {
      groups.set(key, {
        vendor_id: it.vendor_id || it.vendorId || null,
        vendor_name: it.shop_name || it.vendor_name || 'Vendor',
        vendor_whatsapp: it.vendor_whatsapp || it.whatsapp_number || null,
        items: [],
      });
    }
    groups.get(key).items.push(it);
  }
  return Array.from(groups.values()).map((g) => ({
    ...g,
    subtotal: g.items.reduce(
      (s, it) => s + (Number(it.price) || 0) * (it.quantity || 1),
      0
    ),
  }));
}
