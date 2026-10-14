export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests are allowed."
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "API key is missing. Check Vercel Environment Variables."
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    if (messages.length > 20) {
      return res.status(400).json({
        error: "Please send fewer messages at a time."
      });
    }

    const validMessages = messages.every(
      (message) =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.length <= 10000
    );

    if (!validMessages) {
      return res.status(400).json({
        error: "Invalid message format."
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "Mitran AI"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3.5-lightning:free",
          messages: [
            {
              role: "system",
              content:
                "You are Mitran AI, a friendly and creative assistant. " +
                "You can communicate in English, Tamil, and Tanglish. " +
                "Help users with storytelling, roleplay, and everyday questions. " +
                "Respond naturally and follow the user's requested language."
            },
            ...messages
          ],
          max_tokens: 1500
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);

      return res.status(response.status).json({
        error:
          data.error?.message ||
          "The AI provider could not complete your request."
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error: "The AI returned an empty response."
      });
    }

    return res.status(200).json({
      reply
    });
  } catch (error) {
    console.error("Mitran AI error:", error);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
}
