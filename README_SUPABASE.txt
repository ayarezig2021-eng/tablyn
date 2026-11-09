TABLYN — SUPABASE INTEGRATION (PHASE 1)

Files added:
- supabase-config.js: central Supabase URL + public publishable key.
- supabase-data.js: database operations, relies on RLS for authorization.
- supabase-auth.js: sign-up, sign-in, sign-out, customer order panel.
- supabase-site.js: contact form + live data loading for admin overview.
- supabase-contact-policy.sql: optional SQL policy for anonymous contact form submissions.

Already wired in:
- index.html: Supabase auth, contact form, admin access visibility/data.
- studio.html: save/load-ready design persistence and quote submission.

IMPORTANT:
1. Never add a Secret/service_role key to browser files.
2. Run supabase-contact-policy.sql in Supabase SQL Editor if you want visitors
   who are not signed in to use the contact form. Without this policy, the form
   works only for signed-in users under the current RLS policy.
3. The admin dashboard's order/quote lists are now loaded from Supabase, but
   advanced status-edit controls and order-history creation are not yet wired
   into the existing admin interface.
4. Customer order tracking reads orders, order_items and order_status_history.
   Orders are created by an administrator under the current SQL policies.
5. AI endpoint /api/assistant remains separate and still requires OPENAI_API_KEY
   as a Vercel server environment variable. Do not put that key in HTML.
6. Deploy the entire folder; do not upload only index.html or studio.html.

To deploy with Vercel, keep index.html, studio.html, all JS files, assets/ and
api/ in the same project root/folder structure.
