// Backend simples que encaminha as perguntas do assistente para a API da
// Anthropic, mantendo a chave de API protegida no servidor (nunca exposta
// ao navegador). Necessário porque o front-end não pode chamar
// api.anthropic.com diretamente (CORS + segurança da chave).

import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.post("/api/chat", async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ text: "ANTHROPIC_API_KEY não configurada no servidor (.env)." });
  }

  const { question, summary } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
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
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ text: "Erro ao consultar a API da Anthropic." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor do assistente rodando em http://localhost:${PORT}`));
