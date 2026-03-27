module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' })
  }

  const { system, messages, max_tokens } = req.body

  // Translate Anthropic-style request → Gemini format
  const geminiBody = {
    ...(system && {
      system_instruction: { parts: [{ text: system }] },
    }),
    contents: messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: max_tokens || 1000,
    },
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini error:', data)
      return res.status(response.status).json(data)
    }

    // Translate Gemini response → Anthropic-style so Messages.jsx needs no changes
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return res.status(200).json({ content: [{ text }] })
  } catch (err) {
    console.error('Colle proxy error:', err)
    return res.status(500).json({ error: 'Failed to reach Gemini API' })
  }
}
