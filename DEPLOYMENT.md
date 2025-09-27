# 🚀 Guia de Deploy - Auzap.ai Backend

## Deploy no Render

### 1. Conectar Repositório
1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em "New +" → "Web Service"
3. Conecte o repositório: `https://github.com/fellipesaraiva88/aupet-ai-connect.git`
4. Selecione a branch: `main`

### 2. Configuração do Serviço

**Configurações Básicas:**
- **Name**: `auzap-backend`
- **Runtime**: `Node`
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`
- **Instance Type**: `Starter` (pode ser escalado depois)

### 3. Variáveis de Ambiente

Configure estas variáveis no Render:

```env
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://lytpeljmwjugsbapjkeb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHBlbGptd2p1Z3NiYXBqa2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTI3NDEsImV4cCI6MjA3NDQyODc0MX0.IfajDuzonzNXSrpni5_hwrWaT_7Yh8QthQq4bA7O-kc
EVOLUTION_API_URL=https://pangea-evolution-api.kmvspi.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
JWT_SECRET=auzap-jwt-secret-production-2025
JWT_EXPIRE_TIME=24h
API_KEY=auzap-api-key-production-2025
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW_MS=900000
LOG_LEVEL=info
HEALTH_CHECK_INTERVAL=30000
```

### 4. Deploy Automático

O arquivo `backend/render.yaml` já está configurado para deploy automático.

### 5. Configuração Pós-Deploy

Após o deploy, você precisa:

1. **Atualizar WEBHOOK_URL** - Substitua por sua URL do Render
2. **Configurar OpenAI** (opcional) - Adicione `OPENAI_API_KEY` se quiser IA
3. **Configurar Supabase Service Key** (opcional) - Para operações administrativas

### 6. Testando o Deploy

Acesse `https://[seu-app].onrender.com/health` para verificar se está funcionando.

### 7. Configurar Frontend

Após o deploy, atualize a variável `VITE_API_URL` no frontend para apontar para sua URL do Render.

## 🔧 Troubleshooting

### Build Errors
- Certifique-se que o `cd backend` está nos comandos
- Verifique se todas as dependências estão no `package.json`

### Runtime Errors
- Verifique os logs no Render Dashboard
- Confirme que todas as variáveis de ambiente estão configuradas

### Evolution API
- Teste a conexão: `curl -H "apikey: YOUR_KEY" https://pangea-evolution-api.kmvspi.easypanel.host/`

## 🚀 Funcionalidades Implementadas

✅ **Backend Completo**
- API REST com Express.js + TypeScript
- Integração com Evolution API (WhatsApp)
- Integração com Supabase (Database)
- Sistema de AI com OpenAI
- WebSocket para tempo real
- Sistema de autenticação JWT
- Rate limiting e segurança
- Logs estruturados
- Health checks

✅ **Rotas Implementadas**
- `/health` - Health check
- `/api/evolution/*` - Gestão WhatsApp
- `/api/ai/*` - Serviços de IA
- `/api/dashboard/*` - Dashboard stats
- `/api/settings/*` - Configurações
- `/api/webhook/whatsapp` - Webhook WhatsApp

✅ **Pronto para Produção**
- Error handling
- Lazy loading de serviços
- Configuração para diferentes ambientes
- Deploy automático configurado