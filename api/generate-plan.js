// /api/generate-plan.js
// Vercel serverless function (Node 18+). Server-side only.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }
  /* eslint-env node */
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_KEY) {
    console.error('Missing OPENROUTER_API_KEY');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    // Strong instruction for model to output only JSON array of strings
    const systemMessage = {
      role: 'system',
      content:
        'You are a helpful assistant that returns a JSON array of short subtasks. Output ONLY valid JSON: an array of 3 concise strings (no extra text).'
    };
    const userMessage = {
      role: 'user',
      content: `Create 3 short subtasks to achieve this goal: "${prompt}". Output only JSON array.`
    };

    const payload = {
      model: 'mistralai/mistral-7b-instruct:free', // change if your OpenRouter model id is different
      messages: [systemMessage, userMessage],
      temperature: 0.25,
      max_tokens: 300
    };

    const r = await fetch('https://api.openrouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('OpenRouter request failed:', r.status, text);
      return res.status(502).json({ error: 'Model service error', details: text });
    }

    const json = await r.json();
    const content = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text ?? '';

    // Try to parse JSON output from the model
    let subtasks = null;
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        subtasks = parsed.map(s => String(s).trim()).filter(Boolean);
      }
    } catch {
      // ignore — we'll fallback
    }

    // fallback parsing (if model wrapped the JSON or didn't return pure JSON)
    if (!subtasks) {
      const lines = content
        .split(/\n+/)
        .map(l => l.replace(/^\s*[\d\.\-\)\s]+/, '').trim())
        .filter(Boolean);
      subtasks = lines.slice(0, 6);
    }

    // Final safety: ensure at least some meaningful subtasks
    if (!subtasks || subtasks.length === 0) {
      subtasks = ['Define the objective', 'Break into steps', 'Work for a focused block'];
    }

    // Return subtasks array to client
    return res.status(200).json({ subtasks });
  } catch (err) {
    console.error('generate-plan error', err);
    return res.status(500).json({ error: 'internal' });
  }
}
