// Função serverless da Vercel. Tudo dentro de /api é automaticamente
// publicado como um endpoint (aqui: /api/chat) quando você faz o deploy —
// não precisa rodar um servidor separado. A chave da API fica só nas
// variáveis de ambiente do projeto na Vercel, nunca no código.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ text: "Método não permitido." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ text: "ANTHROPIC_API_KEY não configurada nas variáveis de ambiente do projeto." });
  }

  const { question, summary } = req.body || {};
  if (!question || !summary) {
    return res.status(400).json({ text: "Requisição inválida." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Você é o assistente financeiro do app "Régua". Responda em português, de forma direta e curta (2-4 frases), com base apenas nestes dados financeiros do usuário:\n\n${JSON.stringify(summary, null, 2)}\n\nPergunta do usuário: ${question}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.map((b) => b.text || "").join("\n") || "Não consegui gerar uma resposta.";
    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ text: "Erro ao consultar a API da Anthropic." });
  }
}
