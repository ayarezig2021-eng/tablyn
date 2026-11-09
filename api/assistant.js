export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI service is not configured' });
  const { message, language = 'en', context = '' } = req.body || {};
  if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Message is required' });
  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4.1-mini', instructions: `You are Tablyn's helpful, warm, capable AI assistant. Help users with Tablyn, restaurant menu design, QR/NFC products, orders and branding. Be conversational and ask one useful question when needed. Reply in ${language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English'} unless the user writes in another language. Never claim that payments, orders, account changes, QR generation or NFC encoding succeeded unless a connected system confirms it. Context: ${String(context).slice(0, 1500)}`, input: message, max_output_tokens: 450 })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data.error?.message || 'AI provider error' });
    const reply = (data.output || []).flatMap(x => x.content || []).filter(x => x.type === 'output_text').map(x => x.text).join('\n');
    return res.status(200).json({ reply });
  } catch (e) { return res.status(500).json({ error: 'AI request failed' }); }
}
