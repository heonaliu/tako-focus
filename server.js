import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.post("/api/generate-plan", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  try {
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
            content:
              "You are a helpful productivity assistant. Generate exactly 3 concise subtasks in JSON format, e.g. ['Step 1', 'Step 2', 'Step 3']."
          },
          {
            role: "user",
            content: `Goal: ${prompt}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";

    let subtasks = [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) subtasks = parsed;
    } catch {
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
        "Start with the first focused task",
      ];
    }

    res.json({ subtasks });
  } catch (err) {
    console.error("generate-plan error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3001, () => console.log("✅ Server running on http://localhost:3001"));
