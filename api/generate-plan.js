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
            content: "You are a helpful productivity assistant. Generate 3 concise subtasks for the user's focus goal."
          },
          {
            role: "user",
            content: `Goal: ${prompt}`
          }
        ],
      }),
    });

    const data = await response.json();

    console.log("🧠 OpenRouter API response:", data);

    const subtasks = data?.choices?.[0]?.message?.content
      ?.split("\n")
      .filter(line => line.trim() !== "")
      .slice(0, 3) || [];

    res.status(200).json({ subtasks });
  } catch (err) {
    console.error("generate-plan error", err);
    res.status(500).json({ error: "internal" });
  }
}
