import React, { useState, useMemo, useRef, useEffect } from "react";
import Papa from "papaparse";
import { Wallet, Plus, Send, Upload, ArrowUpRight, ArrowDownRight, Loader2, FileWarning } from "lucide-react";

/* ---------------------------------------------------------
   RÉGUA — protótipo de app de controle financeiro pessoal
   Identidade: livro-caixa. Réguas duplas para totais (convenção
   contábil real), números tabulares, carimbos de status.
--------------------------------------------------------- */

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  .regua-root {
    --paper: #E8E4DA;
    --paper-2: #F2EFE7;
    --ink: #1F2A24;
    --ink-soft: #5B5D53;
    --green: #2F6F4E;
    --red: #AF4530;
    --gold: #B4842E;
    --rule: #CBC4B3;
    background: var(--paper);
    background-image: repeating-linear-gradient(180deg, rgba(31,42,34,0.025) 0px, rgba(31,42,34,0.025) 1px, transparent 1px, transparent 28px);
    color: var(--ink);
    font-family: 'IBM Plex Sans', sans-serif;
    min-height: 100vh;
  }
  .regua-root * { box-sizing: border-box; }
  .f-display { font-family: 'Fraunces', serif; }
  .f-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }

  .paper-card {
    background: var(--paper-2);
    border: 1px solid var(--rule);
    box-shadow: 0 1px 0 var(--rule);
  }

  .ledger-row { border-bottom: 1px solid var(--rule); }
  .ledger-row:last-child { border-bottom: none; }

  .ledger-total {
    border-top: 1px solid var(--rule);
    border-bottom: 3px double var(--ink);
    padding-bottom: 6px;
  }

  .dotted-leader {
    flex: 1;
    border-bottom: 1px dotted var(--ink-soft);
    margin: 0 8px;
    height: 1px;
    align-self: flex-end;
    transform: translateY(-5px);
    opacity: 0.6;
  }

  .stamp {
    display: inline-block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 2px 8px;
    border: 1.5px solid currentColor;
    border-radius: 2px;
    transform: rotate(-3deg);
    mix-blend-mode: multiply;
    font-weight: 600;
  }
  .stamp-green { color: var(--green); }
  .stamp-gold { color: var(--gold); }
  .stamp-red { color: var(--red); }

  .tab-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 10px 16px;
    border: 1px solid var(--rule);
    border-bottom: none;
    background: var(--paper);
    color: var(--ink-soft);
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    top: 1px;
  }
  .tab-btn.active {
    background: var(--paper-2);
    color: var(--ink);
    font-weight: 600;
    border-bottom: 1px solid var(--paper-2);
  }
  .tab-btn:hover:not(.active) { background: #ded9cb; }

  .bar-track {
    height: 8px;
    background: #DAD5C6;
    border: 1px solid var(--rule);
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    animation: fillbar 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes fillbar {
    from { transform: scaleX(0); transform-origin: left; }
    to { transform: scaleX(1); transform-origin: left; }
  }

  .fade-up { animation: fadeUp 0.5s ease both; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .input-line {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--rule);
    font-family: 'IBM Plex Sans', sans-serif;
    padding: 8px 4px;
    color: var(--ink);
    outline: none;
    width: 100%;
  }
  .input-line:focus { border-bottom-color: var(--ink); }

  .btn-ink {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: var(--ink);
    color: var(--paper-2);
    border: none;
    padding: 10px 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.15s ease;
  }
  .btn-ink:hover { opacity: 0.85; }
  .btn-ink:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-outline {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: transparent;
    color: var(--ink);
    border: 1px solid var(--ink);
    padding: 9px 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-outline:hover { background: rgba(31,42,34,0.06); }

  .chat-bubble-user { background: var(--ink); color: var(--paper-2); align-self: flex-end; }
  .chat-bubble-bot { background: var(--paper-2); border: 1px solid var(--rule); align-self: flex-start; }

  .drop-zone {
    border: 1.5px dashed var(--rule);
    padding: 18px;
    text-align: center;
    color: var(--ink-soft);
    font-size: 12px;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .drop-zone.drag { border-color: var(--ink); background: rgba(31,42,34,0.04); }

  @media (prefers-reduced-motion: reduce) {
    .bar-fill, .fade-up { animation: none !important; }
  }

  :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
`;

const CATEGORY_RULES = [
  { cat: "Alimentação", keys: ["ifood", "restaurante", "lanchonete", "padaria", "pizza", "burger"] },
  { cat: "Mercado", keys: ["mercado", "supermercado", "atacad", "hortifruti"] },
  { cat: "Transporte", keys: ["uber", "99", "combustível", "posto", "estacionamento", "pedágio"] },
  { cat: "Moradia", keys: ["aluguel", "condomínio", "luz", "energia", "água", "internet", "gás"] },
  { cat: "Assinaturas", keys: ["netflix", "spotify", "amazon prime", "hbo", "disney", "icloud", "youtube premium"] },
  { cat: "Lazer", keys: ["cinema", "ingresso", "bar", "show", "teatro", "balada"] },
  { cat: "Saúde", keys: ["farmácia", "drogaria", "academia", "plano de saúde", "consulta"] },
  { cat: "Educação", keys: ["curso", "faculdade", "mensalidade escolar", "udemy", "livro", "alura"] },
  { cat: "Vestuário", keys: ["renner", "zara", "riachuelo", "loja de roupa", "calçado", "shein"] },
  { cat: "Viagem", keys: ["passagem", "hotel", "airbnb", "123milhas", "decolar", "hostel"] },
  { cat: "Pets", keys: ["petshop", "veterinário", "ração", "pet center"] },
  { cat: "Investimentos", keys: ["tesouro direto", "cdb", "corretora", "ações", "aporte"] },
  { cat: "Doações", keys: ["doação", "vaquinha", "ong"] },
  { cat: "Receita", keys: ["salário", "pix recebido", "transferência recebida", "freelance", "reembolso"] },
];

function guessCategory(desc) {
  const d = (desc || "").toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keys.some((k) => d.includes(k))) return rule.cat;
  }
  return "Outros";
}

const CATEGORY_COLOR = {
  "Alimentação": "#AF4530",
  "Mercado": "#B4842E",
  "Transporte": "#2F6F4E",
  "Moradia": "#5B5D53",
  "Assinaturas": "#7A4E9E",
  "Lazer": "#1F6FA6",
  "Saúde": "#0F766E",
  "Educação": "#8A6D3B",
  "Vestuário": "#946B9E",
  "Viagem": "#3E7CB1",
  "Pets": "#A0743C",
  "Investimentos": "#2F6F4E",
  "Doações": "#B4842E",
  "Outros": "#8A8578",
  "Receita": "#2F6F4E",
};

const SEED_TRANSACTIONS = [
  { id: 1, date: "2026-08-10", desc: "Salário — Empresa XPTO", amount: 6200, category: "Receita", status: "confirmado" },
  { id: 2, date: "2026-08-09", desc: "Aluguel apartamento", amount: -1800, category: "Moradia", status: "confirmado" },
  { id: 3, date: "2026-08-09", desc: "iFood - jantar", amount: -47.9, category: "Alimentação", status: "confirmado" },
  { id: 4, date: "2026-08-08", desc: "Uber", amount: -23.5, category: "Transporte", status: "confirmado" },
  { id: 5, date: "2026-08-07", desc: "Supermercado Extra", amount: -312.4, category: "Mercado", status: "confirmado" },
  { id: 6, date: "2026-08-06", desc: "Netflix", amount: -39.9, category: "Assinaturas", status: "confirmado" },
  { id: 7, date: "2026-08-06", desc: "Spotify", amount: -21.9, category: "Assinaturas", status: "confirmado" },
  { id: 8, date: "2026-08-05", desc: "Posto Ipiranga", amount: -180, category: "Transporte", status: "confirmado" },
  { id: 9, date: "2026-08-04", desc: "Farmácia São Paulo", amount: -64.3, category: "Saúde", status: "confirmado" },
  { id: 10, date: "2026-08-03", desc: "Cinema Ingresso.com", amount: -58, category: "Lazer", status: "confirmado" },
  { id: 11, date: "2026-08-02", desc: "Conta de luz", amount: -145.2, category: "Moradia", status: "pendente" },
  { id: 12, date: "2026-08-01", desc: "Padaria do bairro", amount: -18.5, category: "Alimentação", status: "confirmado" },
  { id: 13, date: "2026-07-30", desc: "Academia Smart Fit", amount: -99.9, category: "Saúde", status: "confirmado" },
  { id: 14, date: "2026-07-28", desc: "Curso Alura", amount: -89, category: "Educação", status: "confirmado" },
  { id: 15, date: "2026-07-25", desc: "Freelance design", amount: 850, category: "Receita", status: "confirmado" },
  { id: 16, date: "2026-07-22", desc: "Petshop Ração", amount: -75.4, category: "Pets", status: "confirmado" },
  { id: 17, date: "2026-07-20", desc: "Aporte Tesouro Direto", amount: -300, category: "Investimentos", status: "confirmado" },
];

const DEFAULT_BUDGETS = {
  "Alimentação": 800,
  "Mercado": 900,
  "Transporte": 300,
  "Moradia": 2000,
  "Assinaturas": 150,
  "Lazer": 250,
  "Saúde": 200,
  "Educação": 200,
  "Vestuário": 200,
  "Pets": 150,
};

function formatBRL(n) {
  const sign = n < 0 ? "-" : "";
  return `${sign}R$ ${Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}`;
}

// Aceita "2026-08-10", "10/08/2026" ou "10-08-2026"
function normalizeDate(raw) {
  const s = (raw || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
}

function normalizeAmount(raw) {
  if (typeof raw === "number") return raw;
  let s = (raw || "").toString().trim().replace(/R\$\s?/i, "");
  // formato BR: 1.234,56 -> 1234.56
  if (/,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export default function ReguaApp() {
  const [tab, setTab] = useState("painel");
  const [transactions, setTransactions] = useState(SEED_TRANSACTIONS);
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
  const [newTx, setNewTx] = useState({ date: "", desc: "", amount: "" });
  const [chatMessages, setChatMessages] = useState([
    { role: "bot", text: "Oi! Pergunte algo sobre seus gastos — ex: \"quanto gastei com comida esse mês?\"" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const balance = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions]);
  const income = useMemo(() => transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0), [transactions]);
  const expense = useMemo(() => transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0), [transactions]);

  const categoryTotals = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.amount < 0).forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    return map;
  }, [transactions]);

  const maxCategoryTotal = Math.max(1, ...Object.values(categoryTotals));

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function addTransaction() {
    if (!newTx.date || !newTx.desc || !newTx.amount) return;
    const amount = normalizeAmount(newTx.amount);
    if (amount === null) return;
    const category = guessCategory(newTx.desc);
    setTransactions((prev) => [
      { id: Date.now(), date: newTx.date, desc: newTx.desc, amount, category, status: "confirmado" },
      ...prev,
    ]);
    setNewTx({ date: "", desc: "", amount: "" });
  }

  function updateBudget(cat, value) {
    setBudgets((prev) => ({ ...prev, [cat]: parseFloat(value) || 0 }));
  }

  function handleCsvFile(file) {
    if (!file) return;
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        let rows = results.data;
        // Detecta e descarta cabeçalho, se houver (primeira célula não parece data nem número)
        if (rows.length && isNaN(normalizeAmount(rows[0][2]))) {
          rows = rows.slice(1);
        }
        const imported = [];
        let errors = 0;
        rows.forEach((row, i) => {
          const [rawDate, desc, rawAmount] = row;
          const date = normalizeDate(rawDate);
          const amount = normalizeAmount(rawAmount);
          if (!date || !desc || amount === null) { errors++; return; }
          imported.push({
            id: Date.now() + i,
            date,
            desc: desc.trim(),
            amount,
            category: guessCategory(desc),
            status: "confirmado",
          });
        });
        if (imported.length) {
          setTransactions((prev) => [...imported, ...prev]);
        }
        setImportMsg(
          errors > 0
            ? `${imported.length} lançamento(s) importado(s), ${errors} linha(s) ignorada(s) por formato inválido.`
            : `${imported.length} lançamento(s) importado(s) com sucesso.`
        );
      },
      error: () => setImportMsg("Não foi possível ler o arquivo. Verifique se é um CSV válido."),
    });
  }

  function onDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleCsvFile(file);
  }

  async function sendChat() {
    const question = chatInput.trim();
    if (!question || chatLoading) return;
    setChatMessages((prev) => [...prev, { role: "user", text: question }]);
    setChatInput("");
    setChatLoading(true);

    const summary = {
      saldo: balance.toFixed(2),
      receitas: income.toFixed(2),
      despesas: expense.toFixed(2),
      gastosPorCategoria: categoryTotals,
      orcamentos: budgets,
      transacoesRecentes: transactions.slice(0, 12).map((t) => ({
        data: t.date, descricao: t.desc, valor: t.amount, categoria: t.category,
      })),
    };

    try {
      // ATENÇÃO: em produção, troque esta chamada por um endpoint de backend
      // (ex: /api/chat) que encaminha para a API da Anthropic com a chave
      // guardada no servidor. Ver server/index.js neste projeto.
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, summary }),
      });
      const data = await response.json();
      const text = data.text || "Não consegui processar sua pergunta agora.";
      setChatMessages((prev) => [...prev, { role: "bot", text }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "bot", text: "Erro ao consultar o assistente. Verifique se o servidor local está rodando (npm run server)." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="regua-root">
      <style>{STYLE}</style>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 20px 60px" }}>
        {/* Header */}
        <div className="fade-up" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wallet size={22} strokeWidth={1.75} />
            <h1 className="f-display" style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Régua</h1>
          </div>
          <p className="f-mono" style={{ fontSize: 11, color: "var(--ink-soft)", letterSpacing: "0.06em", margin: 0, textTransform: "uppercase" }}>
            Suas contas, na régua.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {[
            ["painel", "Painel"],
            ["lancamentos", "Lançamentos"],
            ["orcamentos", "Orçamentos"],
            ["assistente", "Assistente"],
          ].map(([key, label]) => (
            <button key={key} className={`tab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        <div className="paper-card" style={{ padding: 24 }}>
          {tab === "painel" && (
            <div className="fade-up">
              <div style={{ marginBottom: 28 }}>
                <p className="f-mono" style={{ fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Saldo do período</p>
                <div className="ledger-total" style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span className="f-mono" style={{ fontSize: 34, fontWeight: 600, color: balance >= 0 ? "var(--green)" : "var(--red)" }}>
                    {formatBRL(balance)}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                <div className="ledger-row" style={{ paddingBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--green)" }}>
                    <ArrowUpRight size={15} />
                    <span className="f-mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Receitas</span>
                  </div>
                  <p className="f-mono" style={{ fontSize: 20, margin: "4px 0 0" }}>{formatBRL(income)}</p>
                </div>
                <div className="ledger-row" style={{ paddingBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--red)" }}>
                    <ArrowDownRight size={15} />
                    <span className="f-mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Despesas</span>
                  </div>
                  <p className="f-mono" style={{ fontSize: 20, margin: "4px 0 0" }}>{formatBRL(expense)}</p>
                </div>
              </div>

              <p className="f-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Gastos por categoria</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                  <div key={cat}>
                    <div style={{ display: "flex", alignItems: "flex-end", marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{cat}</span>
                      <span className="dotted-leader" />
                      <span className="f-mono" style={{ fontSize: 13 }}>{formatBRL(total)}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(total / maxCategoryTotal) * 100}%`, background: CATEGORY_COLOR[cat] || "var(--ink)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "lancamentos" && (
            <div className="fade-up">
              <p className="f-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Importar extrato (CSV)</p>
              <div
                className={`drop-zone ${dragActive ? "drag" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                style={{ marginBottom: 10, cursor: "pointer" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} style={{ marginBottom: 4 }} />
                <p>Arraste um arquivo .csv aqui ou clique para escolher</p>
                <p style={{ marginTop: 4, opacity: 0.7 }}>Formato: data, descrição, valor — ex. 2026-08-10, iFood, -47.90</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: "none" }}
                  onChange={(e) => handleCsvFile(e.target.files?.[0])}
                />
              </div>
              {importMsg && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)", marginBottom: 20 }}>
                  <FileWarning size={13} /> {importMsg}
                </div>
              )}

              <p className="f-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Novo lançamento manual</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr auto", gap: 10, marginBottom: 24, alignItems: "end" }}>
                <input className="input-line" type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} />
                <input className="input-line" type="text" placeholder="Descrição" value={newTx.desc} onChange={(e) => setNewTx({ ...newTx, desc: e.target.value })} />
                <input className="input-line" type="text" placeholder="Valor (-50)" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} />
                <button className="btn-ink" onClick={addTransaction}><Plus size={14} /> Add</button>
              </div>

              <p className="f-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Extrato ({transactions.length})</p>
              <div>
                {transactions.map((t) => (
                  <div key={t.id} className="ledger-row" style={{ display: "flex", alignItems: "center", padding: "10px 0", gap: 12, flexWrap: "wrap" }}>
                    <span className="f-mono" style={{ fontSize: 12, color: "var(--ink-soft)", width: 40, flexShrink: 0 }}>{formatDate(t.date)}</span>
                    <span style={{ flex: 1, fontSize: 14, minWidth: 120 }}>{t.desc}</span>
                    <span className={`stamp ${t.status === "confirmado" ? "stamp-green" : "stamp-gold"}`} style={{ flexShrink: 0 }}>
                      {t.status === "confirmado" ? "OK" : "Pendente"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--ink-soft)", width: 90, flexShrink: 0 }}>{t.category}</span>
                    <span className="f-mono" style={{ fontSize: 14, width: 100, textAlign: "right", color: t.amount >= 0 ? "var(--green)" : "var(--ink)" }}>
                      {formatBRL(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "orcamentos" && (
            <div className="fade-up">
              <p className="f-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Orçamentos por categoria</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {Object.keys(budgets).map((cat) => {
                  const spent = categoryTotals[cat] || 0;
                  const limit = budgets[cat];
                  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
                  const over = spent > limit;
                  return (
                    <div key={cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{cat}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="f-mono" style={{ fontSize: 12, color: over ? "var(--red)" : "var(--ink-soft)" }}>
                            {formatBRL(spent)} /
                          </span>
                          <input
                            className="f-mono"
                            style={{ width: 70, background: "transparent", border: "none", borderBottom: "1px solid var(--rule)", fontSize: 12, textAlign: "right", padding: "2px" }}
                            type="number"
                            value={limit}
                            onChange={(e) => updateBudget(cat, e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%`, background: over ? "var(--red)" : CATEGORY_COLOR[cat] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "assistente" && (
            <div className="fade-up" style={{ display: "flex", flexDirection: "column", height: 440 }}>
              <p className="f-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Assistente</p>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14, paddingRight: 4 }}>
                {chatMessages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-bot"} style={{ maxWidth: "85%", padding: "10px 14px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {m.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="chat-bubble-bot" style={{ maxWidth: "85%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>pensando…</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input-line" placeholder="Pergunte sobre seus gastos…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
                <button className="btn-ink" onClick={sendChat} disabled={chatLoading}><Send size={14} /></button>
              </div>
            </div>
          )}
        </div>

        <p className="f-mono" style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 20, textAlign: "center", letterSpacing: "0.04em" }}>
          Protótipo — dados fictícios, sem conexão bancária real.
        </p>
      </div>
    </div>
  );
}
