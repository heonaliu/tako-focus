export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: [
          {
            role: "system",
            content: "You are a helpful productivity assistant. Generate exactly 3 concise subtasks in JSON format, e.g. ['Step 1', 'Step 2', 'Step 3']."
          },
          {
            role: "user",
            content: `Goal: ${prompt}`
          }
        ],
      }),
    });

    const data = await response.json();
    console.log("🧠 Full OpenRouter response:", JSON.stringify(data, null, 2));

    const content = data?.choices?.[0]?.message?.content || "";

    let subtasks = [];
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) subtasks = parsed;
    } catch {
      // Otherwise extract from plain text / bullet list
      subtasks = content
        .split(/\n|-/)
        .map(l => l.replace(/^\s*\d+[\)\.]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    if (!subtasks.length) {
      subtasks = [
        "Clarify the main objective",
        "Break it into clear steps",
        "Start with the first focused task"
      ];
    }

    res.status(200).json({ subtasks });
  } catch (err) {
    console.error("generate-plan error", err);
    res.status(500).json({ error: "internal" });
  }
}
