# 🔍 Plano de Auditoria e Verificação Completa - Auzap.ai

**Data:** 2025-09-30  
**Objetivo:** Identificar e prevenir erros antes que aconteçam em produção

---

## 1. ✅ Auditoria de Schema do Banco de Dados

### 1.1 Verificar Consistência de Nomes de Colunas

**Problema identificado:** Código usando nomes de colunas que não existem no banco.

**Tabelas principais para auditar:**
- `conversations` vs `whatsapp_conversations` (2 tabelas diferentes!)
- `whatsapp_instances`
- `whatsapp_messages`
- `whatsapp_contacts`
- `customers`
- `pets`
- `appointments`
- `products`
- `profiles`

**Ação:**
```sql
-- Para cada tabela, verificar todas as colunas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'whatsapp_conversations', 'whatsapp_instances', 'whatsapp_messages')
ORDER BY table_name, ordinal_position;
```

**Verificar no código:**
- [ ] Buscar no código todos os `.select()`, `.order()`, `.eq()` do Supabase
- [ ] Comparar com schema real
- [ ] Corrigir discrepâncias

---

## 2. 🔐 Auditoria de Variáveis de Ambiente

### 2.1 Backend (.env)
- [ ] `SUPABASE_URL` - correto e acessível
- [ ] `SUPABASE_ANON_KEY` - válido
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - válido e protegido
- [ ] `JWT_SECRET` - configurado
- [ ] `REDIS_URL` - formato correto (redis://host:port)
- [ ] `OPENAI_API_KEY` - válido
- [ ] `FRONTEND_URL` - aponta para frontend correto
- [ ] `WEBHOOK_URL` - acessível publicamente

### 2.2 Frontend (.env)
- [ ] `VITE_API_URL` - aponta para backend correto (SEM /api no final)
- [ ] `VITE_SUPABASE_URL` - mesmo que backend
- [ ] `VITE_SUPABASE_ANON_KEY` - mesmo que backend

### 2.3 Render Environment Variables
- [ ] Backend service - todas variáveis configuradas
- [ ] Frontend service - `VITE_API_URL` correto
- [ ] Worker service - todas variáveis necessárias
- [ ] Redis service - `REDIS_URL` compartilhado corretamente

---

## 3. 🛡️ Auditoria de Tratamento de Erros

### 3.1 Erros de Duplicata (Unique Constraints)
**Status:** ✅ Corrigido em whatsapp-baileys.ts

**Verificar em outras rotas:**
- [ ] `POST /customers` - verificar se cliente já existe
- [ ] `POST /pets` - verificar se pet já existe
- [ ] `POST /appointments` - verificar conflitos de horário
- [ ] `POST /products` - verificar SKU duplicado

### 3.2 Erros de Validação
- [ ] Todos os endpoints têm validação Zod
- [ ] Mensagens de erro são user-friendly
- [ ] Logs técnicos separados de mensagens ao usuário

### 3.3 Erros de Autenticação
- [ ] Token inválido → 401 com mensagem clara
- [ ] Token expirado → refresh automático
- [ ] Permissões insuficientes → 403 com explicação

---

## 4. 🔄 Auditoria de APIs e Rotas

### 4.1 Verificar Prefixos de URL
**Problema:** Frontend às vezes usa `/api` e às vezes não.

**Verificar arquivos:**
- [ ] `frontend/src/lib/axios.ts` - baseURL SEM /api
- [ ] `frontend/src/hooks/useApiData.ts` - adiciona /api automaticamente
- [ ] `frontend/src/hooks/useAdmin.ts` - consistente
- [ ] Todos os arquivos de serviços em `frontend/src/services/`

### 4.2 Testar Todos os Endpoints Críticos
- [ ] `GET /api/conversations` - lista conversas
- [ ] `POST /api/whatsapp/create` - cria instância (sem duplicata)
- [ ] `GET /api/whatsapp/status/:id` - status da instância
- [ ] `POST /api/messages/send` - envia mensagem
- [ ] `GET /api/customers` - lista clientes
- [ ] `GET /api/pets` - lista pets
- [ ] `POST /api/appointments` - cria agendamento

---

## 5. 📊 Auditoria de Tipos TypeScript

### 5.1 Interfaces e Types
**Problema:** Types não batem com schema real do banco.

**Verificar:**
- [ ] `backend/src/types/index.ts` - interfaces de todas as tabelas
- [ ] `frontend/src/types/` - tipos do frontend
- [ ] Comparar com schema real do Supabase

### 5.2 Gerar Types Automaticamente
```bash
# Backend
npx supabase gen types typescript --project-id lytpeljmwjugsbapjkeb > backend/src/types/supabase.ts

# Frontend  
npx supabase gen types typescript --project-id lytpeljmwjugsbapjkeb > frontend/src/types/supabase.ts
```

---

## 6. 🧪 Testes End-to-End

### 6.1 Fluxos Críticos para Testar
- [ ] **Onboarding:** Registrar → Login → Criar instância WhatsApp
- [ ] **WhatsApp:** Conectar → Escanear QR → Receber mensagem
- [ ] **Conversas:** Ver lista → Abrir conversa → Enviar resposta
- [ ] **Clientes:** Criar → Editar → Adicionar pet
- [ ] **Agendamentos:** Criar → Confirmar → Cancelar
- [ ] **AI:** Ativar → Configurar personalidade → Testar resposta automática

### 6.2 Testes de Carga
- [ ] 100 mensagens simultâneas
- [ ] 10 instâncias WhatsApp conectadas
- [ ] Dashboard com 1000+ conversas

---

## 7. 🚨 Monitoramento e Alertas

### 7.1 Configurar Sentry/Error Tracking
- [ ] Instalar Sentry no backend
- [ ] Instalar Sentry no frontend
- [ ] Configurar alertas por email
- [ ] Dashboard de erros acessível

### 7.2 Logs Estruturados
- [ ] Todos os erros têm context (userId, organizationId, requestId)
- [ ] Logs de performance (tempo de resposta)
- [ ] Logs de uso (features mais usadas)

### 7.3 Health Checks
- [ ] `/health` do backend responde em <500ms
- [ ] `/health` do worker responde
- [ ] Redis health check
- [ ] Supabase connection check

---

## 8. 📝 Documentação

### 8.1 Atualizar CLAUDE.md
- [ ] Adicionar tabelas reais do banco
- [ ] Documentar formato correto de env vars
- [ ] Listar endpoints e seus parâmetros
- [ ] Incluir troubleshooting comum

### 8.2 Criar Runbook de Erros
```markdown
# Common Errors

## Error: column does not exist
- **Causa:** Schema desatualizado no código
- **Fix:** Verificar schema real no Supabase
- **Prevenção:** Gerar types automaticamente

## Error: duplicate key constraint
- **Causa:** Tentando criar registro que já existe
- **Fix:** Adicionar check before insert
- **Prevenção:** Usar UPSERT ou ON CONFLICT
```

---

## 9. 🔧 Ferramentas de Auditoria

### 9.1 Scripts Úteis
```bash
# Verificar schema do banco
npm run db:schema

# Listar variáveis de ambiente
npm run env:check

# Testar todas as rotas
npm run test:api

# Verificar types
npm run type-check
```

### 9.2 CI/CD Checks
- [ ] Lint na pipeline
- [ ] Type check na pipeline
- [ ] Testes unitários obrigatórios
- [ ] Build sem warnings

---

## 10. ✅ Checklist de Deploy

Antes de cada deploy, verificar:
- [ ] `git pull origin main` executado
- [ ] Testes locais passando
- [ ] Build local sem erros
- [ ] Env vars atualizadas no Render (se necessário)
- [ ] Migrations aplicadas (se houver)
- [ ] Backup do banco feito
- [ ] Deploy em horário de baixo tráfego
- [ ] Monitorar logs por 15min após deploy
- [ ] Testar funcionalidades críticas em produção

---

## 📊 Status Atual

### ✅ Corrigido
- [x] Redis URL parsing
- [x] Frontend API URL consistency
- [x] Conversations query column name
- [x] WhatsApp duplicate instance handling

### 🔄 Em Progresso
- [ ] Auditoria completa de schema
- [ ] Verificação de todas as rotas
- [ ] Testes end-to-end

### ⏳ Pendente
- [ ] Geração automática de types
- [ ] Error tracking (Sentry)
- [ ] Testes de carga
- [ ] Documentação completa

---

## 🎯 Prioridades

1. **ALTA:** Auditoria de schema (prevenir erros 500)
2. **ALTA:** Error handling em todas as rotas
3. **MÉDIA:** Testes end-to-end automatizados
4. **MÉDIA:** Geração automática de types
5. **BAIXA:** Testes de carga
6. **BAIXA:** Documentação detalhada

---

**Próximos Passos:**
1. Executar auditoria de schema completa
2. Verificar e corrigir todas as referências de colunas
3. Adicionar tratamento de erro em rotas faltantes
4. Configurar CI/CD checks
