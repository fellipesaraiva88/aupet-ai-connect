# 📱 Sistema WhatsApp - Documentação Completa

## Visão Geral

Sistema completo de integração WhatsApp para Auzap.ai, com suporte para múltiplos usuários, cada um com sua própria instância WhatsApp gerenciada automaticamente.

## 🏗️ Arquitetura

### Estrutura User → Instance (1:1)

Cada usuário possui **uma única instância WhatsApp** com nomenclatura padronizada:

```
user_[userId] → Instância única do usuário
```

**Exemplo:**
- Usuário ID: `550e8400-e29b-41d4-a716-446655440000`
- Instância: `user_550e8400-e29b-41d4-a716-446655440000`

### Componentes Principais

#### 1. **Database Schema** (`whatsapp_instances`)

```sql
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID,
  status TEXT DEFAULT 'disconnected',
  is_connected BOOLEAN DEFAULT false,
  phone_number TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_whatsapp_instances_user_id ON whatsapp_instances(user_id);
CREATE UNIQUE INDEX idx_whatsapp_instances_user_unique ON whatsapp_instances(user_id);
CREATE INDEX idx_whatsapp_instances_instance_name ON whatsapp_instances(instance_name);
```

#### 2. **WhatsAppManager Service**

Serviço principal que gerencia instâncias WhatsApp:

**Métodos principais:**
- `ensureUserInstance(userId, organizationId)` - Garante que usuário tenha instância
- `connectUserWhatsApp(userId, organizationId)` - Conecta instância do usuário
- `findUserInstance(userId)` - Busca instância existente
- `createUserInstance(userId, organizationId)` - Cria nova instância

**Fluxo automático:**
```typescript
// Quando usuário clica em "Conectar WhatsApp"
1. ensureUserInstance() → Verifica se usuário tem instância
2. Se não tem → createUserInstance() → Cria automaticamente
3. Se tem → Usa instância existente
4. connectUserWhatsApp() → Gera QR Code
```

#### 3. **Webhook System**

Sistema completo de webhooks para eventos do WhatsApp:

**Endpoints:**
- `POST /api/webhook/whatsapp` - Webhook principal
- `POST /api/webhook/user/:userId` - Webhook específico por usuário
- `POST /api/webhook/evolution` - Webhook legado Evolution API

**Eventos processados:**
- `connection.update` - Mudanças de conexão
- `qrcode.updated` - Novo QR Code gerado
- `messages.upsert` - Novas mensagens
- `messages.update` - Atualizações de mensagem
- `messages.delete` - Mensagens deletadas
- `presence.update` - Status de presença
- `chats.update/upsert/delete` - Gerenciamento de chats
- `contacts.update/upsert` - Gerenciamento de contatos
- `groups.update/upsert` - Gerenciamento de grupos

**Exemplo de processamento:**
```typescript
// Webhook recebe evento
{
  "event": "qrcode.updated",
  "instance": { "instanceName": "user_123" },
  "data": { "qrcode": "data:image/png;base64..." }
}

// WebhookHandler processa:
1. Identifica o evento
2. Atualiza banco de dados
3. Notifica usuário via WebSocket
4. Exibe QR Code no frontend
```

#### 4. **WebSocket Notifications**

Notificações em tempo real para usuários:

**Métodos:**
- `sendToUser(userId, data)` - Envia mensagem para usuário específico
- `sendUserNotification(userId, notification)` - Notificação formatada
- `notifyWhatsAppStatus(organizationId, instanceName, status)` - Status global
- `notifyNewMessage(organizationId, message)` - Nova mensagem

**Exemplo de uso:**
```typescript
// Notificar usuário quando QR Code está pronto
wsService.sendToUser(userId, {
  type: 'qrcode',
  data: {
    instanceName: 'user_123',
    qrCode: 'data:image/png;base64...',
    status: 'waiting_qr'
  }
});
```

#### 5. **Health Monitoring**

Sistema de monitoramento automático com auto-recuperação:

**Configuração:**
```typescript
{
  checkIntervalMs: 60000,        // Verifica a cada 1 minuto
  maxConsecutiveFailures: 3,     // 3 falhas consecutivas
  autoReconnect: true,           // Reconecta automaticamente
  alertThreshold: 2              // Alerta após 2 falhas
}
```

**Fluxo de monitoramento:**
```
1. A cada 1 minuto → Verifica todas as instâncias
2. Se desconectada → Registra falha
3. Após 2 falhas → Envia alerta para usuário
4. Após 3 falhas → Tenta reconectar automaticamente
5. Se reconexão funciona → Notifica sucesso
6. Se falha → Notifica erro e pede reconexão manual
```

**Métricas rastreadas:**
- Status atual (healthy, unhealthy, disconnected, error)
- Falhas consecutivas
- Uptime
- Último health check
- Lista de problemas detectados

#### 6. **Error Handling & Retry**

Sistema robusto de retry com backoff exponencial:

**Retry HTTP:**
```typescript
await retryHttp(async () => {
  return api.post('/endpoint', data);
}, 'OperationContext');
```

**Circuit Breaker:**
```typescript
const breaker = new CircuitBreaker(5, 60000, 30000);
await breaker.execute(async () => {
  return evolutionAPI.createInstance(name);
}, 'createInstance');
```

**Configurações de retry:**
- Máximo de tentativas: 3
- Delay inicial: 1000ms
- Backoff exponencial: 2x
- Delay máximo: 30000ms

**Erros retryable:**
- `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`
- `ENETUNREACH`, `ECONNRESET`
- HTTP: 502, 503, 504
- Network timeout errors

## 🔄 Fluxos de Uso

### 1. Conectar WhatsApp (Novo Usuário)

```
Usuário clica "Conectar WhatsApp"
    ↓
Frontend → POST /api/whatsapp/connect
    ↓
Backend: ensureUserInstance(userId)
    ↓
Verifica se já tem instância?
    ↓ Não
createUserInstance(userId)
    ↓
Evolution API: POST /instance/create { instanceName: "user_123" }
    ↓
Salva no banco com user_id
    ↓
connectUserWhatsApp(userId)
    ↓
Evolution API: GET /instance/connect/user_123
    ↓
Retorna QR Code
    ↓
WebSocket envia QR para usuário
    ↓
Usuário escaneia QR Code
    ↓
Webhook recebe connection.update (status: open)
    ↓
WebSocket notifica "Conectado! ✅"
```

### 2. Receber Mensagem

```
Cliente envia mensagem WhatsApp
    ↓
Evolution API detecta mensagem
    ↓
POST /api/webhook/whatsapp
    {
      "event": "messages.upsert",
      "data": { "message": "Olá!" }
    }
    ↓
WebhookHandler.handleNewMessage()
    ↓
1. Salva contato no banco
2. Cria/busca conversa
3. Salva mensagem
    ↓
WebSocket notifica usuário
    ↓
Se auto-reply ativo → Processa com IA
    ↓
IA gera resposta
    ↓
Evolution API envia resposta
```

### 3. Auto-Recuperação

```
Health Monitor detecta instância offline
    ↓
Falha 1 → Registra
Falha 2 → Alerta usuário ⚠️
Falha 3 → Tenta reconectar automaticamente
    ↓
whatsAppManager.connectUserWhatsApp(userId)
    ↓
Se sucesso:
  → WebSocket: "Reconectado! ✅"
    ↓
Se falha:
  → WebSocket: "Reconexão falhou ❌"
  → Botão: "Reconectar Agora"
```

## 📊 Migração

### Atualizar instâncias existentes

```bash
# Verificar instâncias sem user_id
npm run migrate:whatsapp check

# Atualizar todas as instâncias
npm run migrate:whatsapp update

# Migrar instância específica
npm run migrate:whatsapp migrate user_123
```

## 🧪 Testes

### Executar testes completos

```bash
npm run test:whatsapp
```

**O que é testado:**
1. ✅ Schema do banco (user_id, índices)
2. ✅ Criação automática de instância
3. ✅ Conexão Evolution API
4. ✅ Endpoints de webhook
5. ✅ Health monitoring

## 🔧 Comandos Úteis

### Backend

```bash
# Iniciar servidor
npm run dev

# Migrar instâncias
npm run migrate:whatsapp update

# Testar fluxo completo
npm run test:whatsapp
```

### SQL (Supabase)

```sql
-- Ver todas as instâncias e seus usuários
SELECT
  p.email,
  wi.instance_name,
  wi.status,
  wi.is_connected
FROM profiles p
LEFT JOIN whatsapp_instances wi ON wi.user_id = p.id
ORDER BY p.created_at DESC;

-- Resetar instância de usuário
DELETE FROM whatsapp_instances WHERE user_id = 'user-id-here';
```

## 📝 Variáveis de Ambiente

```env
# Evolution API
EVOLUTION_API_URL=https://api.evolution.com
EVOLUTION_API_KEY=your-api-key

# Webhooks
WEBHOOK_URL=https://your-backend.com

# Frontend
FRONTEND_URL=https://your-frontend.com
```

## 🚨 Troubleshooting

### Problema: QR Code não aparece

**Solução:**
1. Verificar logs do backend
2. Testar Evolution API: `curl $EVOLUTION_API_URL/instance/fetchInstances`
3. Verificar webhook configurado
4. Testar conexão WebSocket

### Problema: Instância não reconecta

**Solução:**
1. Verificar health monitor logs
2. Forçar reconexão: `POST /api/whatsapp/connect`
3. Verificar circuit breaker status
4. Resetar instância se necessário

### Problema: Mensagens não chegam

**Solução:**
1. Verificar webhook na Evolution API
2. Testar endpoint: `POST /api/webhook/test`
3. Verificar logs do WebhookHandler
4. Confirmar instância está conectada

## 📚 Referências

- [Evolution API v2 Docs](https://doc.evolution-api.com)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Socket.io](https://socket.io/docs/v4/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

## 🎯 Próximos Passos

- [ ] Implementar testes E2E com Playwright
- [ ] Adicionar métricas Prometheus
- [ ] Dashboard de health monitoring
- [ ] Backup automático de conversas
- [ ] Suporte para múltiplas instâncias por usuário (opcional)
- [ ] API REST completa para gestão de instâncias