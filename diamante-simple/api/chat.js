// api/chat.js (Vercel Serverless Function)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const { message, mode, history } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    const system = buildSystemPrompt(mode);

    const messages = [
      { role: "system", content: system },
      ...(Array.isArray(history) ? history : []).filter(Boolean),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).send(errText);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "";

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}

function buildSystemPrompt(mode) {
  const base =
    `You are "Krystory Crystal Assistant". ` +
    `Your job: recommend crystals + a gentle intention + a 2-step micro ritual. ` +
    `Tone: warm, minimal, modern. ` +
    `Rules: no medical claims, no guaranteed outcomes. ` +
    `Format: 1) Quick read (1-2 lines) 2) 3 crystal suggestions (bullets) 3) Intention sentence 4) Micro ritual (2 steps).`;

  const focus = {
    love: "User wants love/relationship support. Prioritize heart/connection themes.",
    calm: "User feels anxious. Prioritize grounding/soothing themes.",
    focus: "User needs clarity/focus. Prioritize clarity/discipline themes.",
  };

  return mode && focus[mode] ? `${base}\n\nMode: ${focus[mode]}` : base;
}