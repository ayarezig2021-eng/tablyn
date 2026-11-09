/* Tablyn data access. All authorization is enforced by Supabase RLS. */
(function () {
  const client = () => {
    if (!window.tablynSupabaseReady || !window.tablynSupabase) throw new Error('Supabase is not configured. Refresh the page and try again.');
    return window.tablynSupabase;
  };
  async function requireUser() {
    const { data, error } = await client().auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Please sign in first.');
    return data.user;
  }
  async function getProfile(userId) {
    const { data, error } = await client().from('profiles').select('id, full_name, phone, role, created_at').eq('id', userId).single();
    if (error) throw error;
    return data;
  }
  async function listDesigns() {
    const user = await requireUser();
    const { data, error } = await client().from('card_designs').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  async function saveDesign(values, existingId) {
    const user = await requireUser();
    const payload = { ...values, user_id: user.id, updated_at: new Date().toISOString() };
    let query;
    if (existingId) {
      const { data, error } = await client().from('card_designs').update(payload).eq('id', existingId).eq('user_id', user.id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await client().from('card_designs').insert(payload).select().single();
    if (error) throw error;
    return data;
  }
  async function deleteDesign(id) {
    const user = await requireUser();
    const { error } = await client().from('card_designs').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
  }
  async function createQuote(values) {
    const user = await requireUser();
    const { data, error } = await client().from('quote_requests').insert({ ...values, user_id: user.id }).select().single();
    if (error) throw error;
    return data;
  }
  async function sendContact(values) {
    const { data: { user } } = await client().auth.getUser();
    const { error } = await client().from('contact_messages').insert({ ...values, user_id: user?.id || null });
    if (error) throw error;
    return { success: true };
  }
  async function listMyOrders() {
    const user = await requireUser();
    const { data, error } = await client().from('orders')
      .select('id, order_number, status, customer_name, customer_email, subtotal, delivery_fee, total, currency, tracking_code, estimated_delivery, created_at, order_items(id, product_type, material, shape, brand_name, quantity, unit_price, line_total), order_status_history(id, status, message, created_at)')
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  async function adminOverview() {
    const profile = window.tablynAuthState?.profile;
    if (profile?.role !== 'admin') throw new Error('Administrator access required.');
    const db = client();
    const [orders, quotes, designs, contacts] = await Promise.all([
      db.from('orders').select('id, order_number, status, customer_name, customer_email, total, currency, created_at').order('created_at', { ascending: false }).limit(100),
      db.from('quote_requests').select('id, contact_name, contact_email, quantity, status, quoted_price, currency, created_at').order('created_at', { ascending: false }).limit(100),
      db.from('card_designs').select('id, design_name, brand_name, product_type, created_at').order('created_at', { ascending: false }).limit(100),
      db.from('contact_messages').select('id, name, email, subject, message, status, created_at').order('created_at', { ascending: false }).limit(100)
    ]);
    for (const result of [orders, quotes, designs, contacts]) if (result.error) throw result.error;
    return { orders: orders.data || [], quotes: quotes.data || [], designs: designs.data || [], contacts: contacts.data || [] };
  }
  async function updateOrderStatus(orderId, status, message) {
    const profile = window.tablynAuthState?.profile;
    if (profile?.role !== 'admin') throw new Error('Administrator access required.');
    const db = client();
    const { data: { user } } = await db.auth.getUser();
    const { error: updateError } = await db.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (updateError) throw updateError;
    const { error: historyError } = await db.from('order_status_history').insert({ order_id: orderId, status, message: message || null, changed_by: user.id });
    if (historyError) throw new Error('Order status was updated, but its history entry failed: ' + historyError.message);
  }
  window.TablynData = { requireUser, getProfile, listDesigns, saveDesign, deleteDesign, createQuote, sendContact, listMyOrders, adminOverview, updateOrderStatus };
})();
