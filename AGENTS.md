# MedBook — AGENTS.md

## Comandos essenciais

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor dev Next.js |
| `pnpm build` | Build de producao (`ignoreBuildErrors: true` — erros TS nao bloqueiam) |
| `pnpm lint` | ESLint (Next.js) |
| `pnpm test` | Jest (jsdom, ts-jest) |
| `pnpm db:generate` | Gera migration SQL com Drizzle Kit |
| `pnpm db:migrate` | Aplica migrations no banco |
| `pnpm db:studio` | Drizzle Studio (navegador de dados) |

## Framework & toolchain

- **Next.js 16** App Router, `src/` dir, `@/*` → `src/*`
- **Drizzle ORM** + Supabase PostgreSQL. Migrations usam `DIRECT_URL` (pooler nao funciona). Runtime usa `DATABASE_URL` (pooler porta 6543, `prepare: false`).
- **LangGraph.js** — agente conversacional. Grafo em `src/lib/langgraph/` com 3 nodes: `doubt_resolution`, `scheduling`, `pre_anamnesis`. Router node classifica intencao antes de rotear.
- **Google Calendar API** — agendamento via service account. Client em `src/lib/calendar/google.ts`.
- **Web Chat** — novo fluxo. Chat standalone em `/chat` e widget embed via iframe em `/chat/embed`. Usa o mesmo agente LangGraph, persistencia no Supabase (tabelas `chat_sessions` + `chat_messages`).
- **Meta API (deferido)** — codigo WhatsApp/IG/FB existe em `src/lib/meta/` e `src/app/api/webhook/route.ts` mas nao esta ativo. Webhook responde ao GET verify mas nao envia mensagens (WABA sem numero verificado).

## Rotas atuais

```
/                   → redirect para /admin
/admin              → Visao de agendamentos (Google Calendar)
/admin/contexto     → Gestao da base de conhecimento da IA
/chat               → Chat web standalone
/chat/embed         → Chat embed (iframe snippet)
/api/chat           → POST endpoint do chat (message + sessionId → reply)
/api/webhook        → Webhook Meta (GET verify — preparado, nao ativo)
/api/health         → Health check (DB + tabelas + RLS)
```

## Pontos de atencao

- **`strict: false`** no `tsconfig.json` — tipos relaxados, mas evite `any`.
- **`ignoreBuildErrors: true`** no `next.config.ts` — build nunca falha por TS, mas erros aparecem no log.
- **Middleware** (`src/proxy.ts`) tem `matcher: []` — nunca executa. Se for ativar, lembrar de adicionar os paths.
- **README.md** descreve arquitetura SaaS antiga (Stripe, Resend, i18n, cron reminders). Projeto real e chatbot web-first com Google Calendar.
- **Schema** (`src/db/schema.ts`) ainda tem colunas legadas: `stripeCustomerId`, `subscriptionId`, `supabaseId`. Nao sao usadas mas estao no banco.
- **`src/lib/langgraph/persistence.ts`** exporta SqliteSaver mas `graph.ts` usa `MemorySaver` direto. O persistence nao esta conectado.
- **`.github/workflows/`** vazio — sem CI/CD configurado. Deploy manual no Vercel via git push.
- **Variaveis de ambiente** em `.env.local` (gitignorado). `GOOGLE_CALENDAR_PRIVATE_KEY` precisa de `replace(/\\n/g, "\n")` (ja tratado em `google.ts:23`).
- **Testes** sao Jest puro, apenas unitarios. Testes atuais em `src/lib/*.test.ts` cobrem utils e edge routing do grafo.

## Variaveis de ambiente necessarias

```env
DATABASE_URL=               # Supabase pooler (porta 6543, prepare: false)
DIRECT_URL=                 # Supabase direto (porta 5432, para migrations)
GROQ_API_KEY=               # Chave da API Groq
GOOGLE_CALENDAR_CLIENT_EMAIL=  # Service account email
GOOGLE_CALENDAR_PRIVATE_KEY=   # Chave privada (com \n literais)
GOOGLE_CALENDAR_ID=         # ID do calendario Google
CLINIC_ID=                  # ID da clinica no banco
NEXT_PUBLIC_APP_URL=        # URL do deploy (ex: https://medbook.vercel.app)

# Meta/WhatsApp (deferido — nao obrigatorio para o chat web)
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
PAGE_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
FACEBOOK_PAGE_ID=
```

## Fluxo de trabalho

1. Editar schema em `src/db/schema.ts`
2. `pnpm db:generate` + `pnpm db:migrate`
3. `pnpm test` (testes unitarios existentes)
4. git add/commit/push → Vercel deploy automatico

## Estrutura dos modulos principais

| Diretorio | Responsabilidade |
|-----------|-----------------|
| `src/lib/langgraph/` | Grafo do agente (state, nodes, edges, tools, graph) |
| `src/lib/chat/` | Persistencia de sessoes do chat web (session.ts) |
| `src/lib/calendar/` | Integracao Google Calendar API |
| `src/lib/rag/` | Base de conhecimento da clinica (tabela `clinic_context`) |
| `src/lib/meta/` | Normalizacao e envio Meta (deferido) |
| `src/lib/ai.ts` | Cliente Groq (OpenAI-compatible) com Proxy lazy |
| `src/db/schema.ts` | Schema Drizzle (todas as tabelas) |
| `src/app/chat/` | Chat web standalone + embed |
| `src/app/api/chat/` | API do chat web |
| `src/app/admin/` | Interface administrativa |
| `src/app/api/webhook/` | Webhook Meta (deferido) |
| `src/components/chat/` | Componentes de UI do chat (ChatMessages) |

## Embed via iframe

```html
<iframe src="https://medbook.vercel.app/chat/embed"
  style="position:fixed;bottom:20px;right:20px;width:380px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);z-index:9999">
</iframe>
```
