# Régua — controle financeiro pessoal

Protótipo de app de finanças com identidade visual de livro-caixa: réguas
duplas para totais, números tabulares e carimbos de status. Dados fictícios,
sem conexão bancária real.

## Funcionalidades

- **Painel** — saldo, receitas, despesas e gastos por categoria
- **Lançamentos** — extrato, adição manual e **import de CSV**
- **Orçamentos** — limite editável por categoria com alerta visual de estouro
- **Assistente** — chat que responde perguntas sobre seus dados usando a API da Anthropic

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar a chave da API (só necessária para o Assistente)

```bash
cp .env.example .env
# edite .env e cole sua chave: ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Rodar o backend (proxy do assistente) e o front-end

Em dois terminais separados:

```bash
npm run server   # backend em http://localhost:3001
npm run dev      # front-end em http://localhost:5173
```

O Vite já está configurado para redirecionar chamadas `/api/*` para o
backend local (veja `vite.config.js`).

> Se você não quiser configurar o assistente agora, o resto do app
> (painel, lançamentos, orçamentos, import de CSV) funciona normalmente
> sem o backend — só a aba "Assistente" vai mostrar erro de conexão.

## Por que existe um backend?

A API da Anthropic não pode ser chamada diretamente do navegador em uma
aplicação real: isso exigiria expor sua chave de API no código do
front-end, o que é inseguro, e a maioria das chamadas seria bloqueada por
CORS. O `server/index.js` resolve isso fazendo a chamada do lado do
servidor, com a chave guardada em `.env` (nunca commitado — já está no
`.gitignore`).

## Formato do CSV para importação

Três colunas, sem cabeçalho obrigatório (se houver, é detectado e ignorado):

```
2026-08-10, iFood - jantar, -47.90
2026-08-09, Salário, 6200
10/08/2026, Uber, -23.50
```

Datas aceitas: `AAAA-MM-DD` ou `DD/MM/AAAA`. Valores aceitam vírgula ou
ponto decimal. A categoria é atribuída automaticamente por palavra-chave
na descrição (veja `CATEGORY_RULES` em `src/App.jsx` para editar as regras).

## Publicar online (Vercel)

O projeto já está pronto para a Vercel: o front-end é buildado com Vite e o
assistente roda como função serverless em `api/chat.js` (sem precisar de
`server/index.js` em produção — esse arquivo continua útil só para testar
localmente sem a Vercel CLI).

**Passo a passo:**

1. Crie uma conta grátis em [vercel.com](https://vercel.com) (dá pra entrar com GitHub).

2. Suba este projeto para um repositório no GitHub:
   ```bash
   cd regua-project
   git init
   git add .
   git commit -m "Régua - controle financeiro"
   ```
   Crie um repositório vazio no GitHub e siga as instruções dele para
   `git remote add origin ...` e `git push`.

3. Na Vercel, clique em **Add New → Project** e importe o repositório.
   Ela detecta automaticamente que é um projeto Vite — não precisa mudar nada.

4. Antes de clicar em **Deploy**, adicione a variável de ambiente:
   - Vá em **Environment Variables**
   - Nome: `ANTHROPIC_API_KEY`
   - Valor: sua chave (de [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys))

5. Clique em **Deploy**. Em ~1 minuto você recebe um link público, tipo
   `regua-financas.vercel.app`.

**Alternativa via linha de comando** (sem GitHub):
```bash
npm install -g vercel
cd regua-project
vercel
```
Siga as perguntas no terminal. Depois configure a variável de ambiente com:
```bash
vercel env add ANTHROPIC_API_KEY
```
e rode `vercel --prod` para publicar a versão final.

**Testar a função serverless localmente antes de publicar:**
```bash
npm install -g vercel
vercel dev
```
Isso simula o ambiente da Vercel (front-end + `/api/chat`) na sua máquina,
lendo a chave do arquivo `.env`.



```
regua-project/
├── api/
│   └── chat.js          # função serverless (Vercel) para o assistente
├── src/
│   ├── App.jsx           # componente principal (toda a lógica e UI)
│   └── main.jsx           # ponto de entrada React
├── server/
│   └── index.js            # backend alternativo p/ dev local sem Vercel CLI
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
└── .env.example
```

## Próximos passos sugeridos

- Trocar o armazenamento em memória por um banco de dados (ex: SQLite, Postgres)
- Adicionar autenticação de usuário
- Persistir orçamentos e categorias customizadas
- Publicar o backend (Render, Railway, Fly.io) e o front-end (Vercel, Netlify)
