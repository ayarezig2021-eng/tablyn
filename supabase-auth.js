/* Authentication and account UI. Role is read only from the protected profiles table. */
(function () {
  const $ = id => document.getElementById(id);
  const db = () => window.tablynSupabase;
  const authState = { user: null, profile: null, loading: true };
  window.tablynAuthState = authState;
  const say = msg => { if (typeof window.toast === 'function') window.toast(msg); else alert(msg); };
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function accountPanel() {
    let panel = $('tablynAccountPanel');
    if (panel) return panel;
    panel = document.createElement('div'); panel.id = 'tablynAccountPanel';
    panel.className = 'fixed inset-0 z-[70] hidden items-center justify-center bg-black/60 p-4';
    panel.innerHTML = `<section class="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-2xl"><div class="flex items-center justify-between gap-3"><div><h2 class="text-xl font-bold">My Tablyn account</h2><p id="tablynAccountIdentity" class="text-sm text-muted"></p></div><button id="tablynAccountClose" class="rounded-lg border border-line px-3 py-2">✕</button></div><div class="mt-5 flex items-center justify-between"><h3 class="font-semibold">My orders & progress</h3><button id="tablynOrdersRefresh" class="rounded-lg border border-line px-3 py-2 text-sm">Refresh</button></div><div id="tablynOrdersList" class="mt-3 space-y-3"><p class="text-sm text-muted">Loading orders…</p></div><div class="mt-5 flex justify-end"><button id="tablynSignOut" class="rounded-xl bg-indigo-600 px-4 py-2 text-white">Sign out</button></div></section>`;
    document.body.appendChild(panel);
    $('tablynAccountClose').addEventListener('click', () => panel.classList.add('hidden'));
    panel.addEventListener('click', e => { if (e.target === panel) panel.classList.add('hidden'); });
    $('tablynOrdersRefresh').addEventListener('click', loadOrders);
    $('tablynSignOut').addEventListener('click', signOut);
    return panel;
  }
  async function loadOrders() {
    const target = $('tablynOrdersList');
    target.innerHTML = '<p class="text-sm text-muted">Loading orders…</p>';
    try {
      const orders = await window.TablynData.listMyOrders();
      if (!orders.length) { target.innerHTML = '<p class="rounded-xl bg-surface2 p-4 text-sm text-muted">No orders yet. Your confirmed production orders will appear here.</p>'; return; }
      target.innerHTML = orders.map(o => {
        const items = (o.order_items || []).map(i => `<li>${escapeHtml(i.product_type)} · ${escapeHtml(i.quantity)} × ${escapeHtml(i.material || '')}</li>`).join('');
        const history = (o.order_status_history || []).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).map(h=>`<li class="text-xs text-muted">${escapeHtml(h.status.replaceAll('_',' '))} · ${new Date(h.created_at).toLocaleString()}</li>`).join('');
        return `<article class="rounded-xl border border-line p-4"><div class="flex flex-wrap items-center justify-between gap-2"><strong>Order #${escapeHtml(o.order_number)}</strong><span class="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold">${escapeHtml(o.status.replaceAll('_',' '))}</span></div><p class="mt-1 text-sm text-muted">${new Date(o.created_at).toLocaleDateString()} · ${escapeHtml(o.currency)} ${escapeHtml(o.total)}</p><ul class="mt-2 list-disc ps-5 text-sm">${items}</ul>${o.tracking_code?`<p class="mt-2 text-sm">Tracking: ${escapeHtml(o.tracking_code)}</p>`:''}${o.estimated_delivery?`<p class="text-sm">Estimated delivery: ${escapeHtml(o.estimated_delivery)}</p>`:''}<details class="mt-3"><summary class="cursor-pointer text-sm font-semibold">Status history</summary><ol class="mt-2 list-disc space-y-1 ps-5">${history || '<li class="text-xs text-muted">No status updates yet.</li>'}</ol></details></article>`;
      }).join('');
    } catch (e) { target.textContent = e.message || 'Could not load your orders.'; }
  }
  async function openAccount() {
    if (!authState.user) { $('authModal')?.classList.remove('hidden'); $('authModal')?.classList.add('grid'); return; }
    const panel = accountPanel(); $('tablynAccountIdentity').textContent = authState.profile?.full_name || authState.user.email;
    panel.classList.remove('hidden'); panel.classList.add('flex'); await loadOrders();
  }
  async function signOut() {
    const { error } = await db().auth.signOut();
    if (error) return say(error.message);
    accountPanel().classList.add('hidden'); say('You are signed out.');
  }
  async function refreshAuth(session) {
    authState.user = session?.user || null; authState.profile = null;
    if (authState.user) {
      try { authState.profile = await window.TablynData.getProfile(authState.user.id); }
      catch (e) { console.error('[Tablyn] Profile could not be loaded:', e); }
    }
    authState.loading = false;
    window.dispatchEvent(new CustomEvent('tablyn:auth-changed', { detail: authState }));
    window.tablynIsAdmin = authState.profile?.role === 'admin';
    document.querySelectorAll('.js-admin-toggle').forEach(b => b.classList.toggle('hidden', !window.tablynIsAdmin));
    document.querySelectorAll('.js-open-auth').forEach(b => { b.textContent = authState.user ? (window.tablynIsAdmin ? 'Admin account' : 'My account') : 'Sign In / Register'; });
    if (typeof window.renderNavButtons === 'function') window.renderNavButtons();
    document.querySelectorAll('.js-open-auth').forEach(b => { b.onclick = e => { e.preventDefault(); openAccount(); }; });
    if (window.tablynIsAdmin && typeof window.loadTablynAdmin === 'function') window.loadTablynAdmin();
  }
  async function submitAuth(e) {
    e.preventDefault();
    const mode = document.querySelector('.modeBtn.bg-indigo-600')?.dataset.mode || 'signin';
    const email = $('authEmail').value.trim(); const password = $('authPass').value;
    const fullName = $('authName').value.trim();
    const submit = $('authForm').querySelector('button[type="submit"],button:not([type])');
    if (submit) { submit.disabled = true; submit.textContent = 'Please wait…'; }
    try {
      if (mode === 'register') {
        const { data, error } = await db().auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        if (data.session) { document.getElementById('authModal').classList.add('hidden'); say('Account created successfully.'); await refreshAuth(data.session); }
        else { document.getElementById('authModal').classList.add('hidden'); say('Account created. Check your email to confirm your address, then sign in.'); }
      } else {
        const { data, error } = await db().auth.signInWithPassword({ email, password });
        if (error) throw error;
        document.getElementById('authModal').classList.add('hidden'); say('Welcome back.'); await refreshAuth(data.session);
      }
    } catch (err) { say(err.message || 'Authentication failed.'); }
    finally { if (submit) { submit.disabled = false; submit.textContent = 'Continue'; } }
  }
  async function init() {
    if (!window.tablynSupabaseReady) { console.error('[Tablyn] Supabase is unavailable.'); return; }
    const roleAdmin = document.querySelector('[data-role="admin"]');
    if (roleAdmin?.parentElement) roleAdmin.parentElement.classList.add('hidden');
    document.querySelectorAll('[data-role="client"]').forEach(b => b.classList.add('hidden'));
    $('authForm')?.addEventListener('submit', submitAuth, true);
    $('authForm')?.addEventListener('submit', e => { e.stopImmediatePropagation(); }, false);
    const { data: { session } } = await db().auth.getSession();
    await refreshAuth(session);
    db().auth.onAuthStateChange((_event, nextSession) => { setTimeout(() => refreshAuth(nextSession), 0); });
  }
  window.TablynAuth = { openAccount, signOut, refresh: () => db().auth.getSession().then(x => refreshAuth(x.data.session)) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
