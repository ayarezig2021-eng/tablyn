/* Tablyn Supabase configuration. Publishable key is safe for browser use. */
(function () {
  const SUPABASE_URL = 'https://bunmtbkwqvuymjdunnqg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_GSGUjWn5a9unLyZ9MQcGqw_ofvoxdHh';
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[Tablyn] Supabase JS library did not load.');
    window.tablynSupabaseReady = false;
    return;
  }
  window.tablynSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.tablynSupabaseReady = true;
})();
