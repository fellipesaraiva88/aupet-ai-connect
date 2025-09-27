# Auzap.ai Backend

Backend Node.js/Express para o sistema Auzap.ai - Integração WhatsApp com IA para pet shops.

## 🚀 Tecnologias

- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Linguagem tipada
- **Socket.io** - WebSocket para real-time
- **Supabase** - Banco de dados PostgreSQL
- **Evolution API** - Integração WhatsApp
- **OpenAI GPT-4** - Inteligência artificial
- **Render** - Plataforma de deploy

## 📋 Funcionalidades

### 🤖 Integração WhatsApp
- Conexão via Evolution API (Baileys)
- QR Code para autenticação
- Envio/recebimento de mensagens
- Webhooks para eventos em tempo real
- Suporte a mídias (imagem, áudio, documento)

### 🧠 Inteligência Artificial
- Análise automática de mensagens
- Detecção de intenção e sentimento
- Respostas personalizadas por cliente
- Escalação inteligente para humanos
- Contexto de conversação

### 📊 Dashboard em Tempo Real
- WebSocket para atualizações instantâneas
- Métricas de atendimento
- Alertas de urgência
- Status de conexão WhatsApp

### ⚙️ Configurações
- Horário de funcionamento
- Personalidade da IA
- Palavras-chave de escalação
- Mensagens automáticas

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# Server
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend.vercel.app

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Evolution API
EVOLUTION_API_URL=https://pangea-evolution-api.kmvspi.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

# OpenAI
OPENAI_API_KEY=your_openai_key

# Webhooks
WEBHOOK_URL=https://your-backend.onrender.com

# Security
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

### Instalação Local
```bash
# Clone o repositório
git clone [repo-url]
cd backend

# Instale dependências
npm install

# Configure variáveis
cp .env.example .env
# Edite .env com suas configurações

# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## 📡 Endpoints da API

### WhatsApp (Evolution API)
```
POST /api/evolution/instance/create
POST /api/evolution/instance/:name/connect
GET  /api/evolution/instance/:name/qr
GET  /api/evolution/instance/:name/status
POST /api/evolution/message/send
POST /api/evolution/message/send-media
```

### Webhooks
```
POST /api/webhook/whatsapp
GET  /api/webhook/health
```

### Dashboard
```
GET /api/dashboard/stats
GET /api/dashboard/analytics/conversations
```

### Configurações
```
GET /api/settings/business
PUT /api/settings/business
GET /api/settings/ai
PUT /api/settings/ai
```

### IA
```
POST /api/ai/analyze
POST /api/ai/generate-response
GET  /api/ai/health
```

## 🔄 Fluxo de Mensagens

1. Cliente envia mensagem no WhatsApp
2. Evolution API recebe via webhook
3. Sistema salva no Supabase
4. IA analisa intenção e contexto
5. Se automático: IA gera resposta
6. Se escalação: Notifica atendente
7. Resposta enviada via Evolution API
8. Frontend atualizado via WebSocket

## 🚀 Deploy no Render

### Automático (Recomendado)
1. Conecte seu repositório ao Render
2. Use o arquivo `render.yaml` para configuração
3. Configure variáveis de ambiente sensíveis
4. Deploy automático a cada push

### Manual
1. Crie Web Service no Render
2. Configure build: `npm install && npm run build`
3. Configure start: `npm start`
4. Adicione variáveis de ambiente
5. Deploy

## 📊 Monitoramento

### Health Checks
- `/health` - Status geral do servidor
- `/api/evolution/health` - Status Evolution API
- `/api/ai/health` - Status OpenAI

### Logs
- Pino logger estruturado
- Diferentes níveis: debug, info, warn, error
- Logs de integração Evolution API
- Logs de IA e WebSocket

### Métricas
- Conexões WebSocket ativas
- Mensagens processadas
- Rate limiting
- Uptime do servidor

## 🔒 Segurança

- Rate limiting por IP
- Validação de JWT tokens
- CORS configurado
- Helmet para headers de segurança
- Sanitização de dados
- Logs de auditoria

## 🐛 Troubleshooting

### WhatsApp não conecta
1. Verifique Evolution API health: `/api/evolution/health`
2. Confirme API key e URL
3. Teste conexão direta com Evolution API
4. Verifique logs do webhook

### IA não responde
1. Verifique OpenAI API key
2. Teste health: `/api/ai/health`
3. Confirme configurações de negócio
4. Verifique horário de funcionamento

### WebSocket não atualiza
1. Confirme CORS configurado
2. Verifique autenticação do cliente
3. Teste eventos manualmente
4. Confirme organização ID

## 📞 Suporte

Para dúvidas sobre configuração ou problemas técnicos:
- Verifique logs do Render
- Teste endpoints individualmente
- Confirme variáveis de ambiente
- Consulte documentação Evolution API