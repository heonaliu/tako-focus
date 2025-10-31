// /api/generate-plan.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

    const payload = {
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        {
          role: 'system',
          content:
            'Return only a JSON array of 3 short subtasks to achieve the goal. No explanations, no markdown.'
        },
        {
          role: 'user',
          content: `Create 3 subtasks for: ${prompt}`
        }
      ],
      temperature: 0.3
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    let subtasks;

    try {
      subtasks = JSON.parse(text);
    } catch {
      subtasks = text
        .split('\n')
        .map(line => line.replace(/^[\d\.\-\)\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    return res.status(200).json({ subtasks });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Failed to generate plan' });
  }
}
