# 🔐 Fluxo de Autenticação Explicado - Auzap.ai

## 📝 Por Que o Backend NÃO Tem Rotas de Autenticação Próprias?

### ❌ O Que NÃO Existe
```
POST /api/auth/login   → 404 Not Found
POST /api/auth/signup  → 404 Not Found
POST /api/auth/logout  → 404 Not Found
```

### ✅ Por Que Isso É Correto?

O Auzap.ai usa uma arquitetura moderna de **autenticação delegada** ao Supabase Auth. Isso significa:

1. **Supabase Auth gerencia TUDO relacionado a autenticação**
   - Criação de usuários
   - Login/logout
   - Tokens JWT
   - Refresh tokens
   - Recuperação de senha
   - Email verification
   - MFA (se habilitado)

2. **Backend apenas VALIDA tokens**
   - Não cria tokens
   - Não gerencia sessões
   - Apenas verifica se o token é válido

---

## 🔄 Fluxo Completo de Autenticação

### 1️⃣ **SIGNUP (Criar Conta)**

```typescript
// FRONTEND: frontend/src/hooks/useAuth.ts:86-99
const signUp = async (email: string, password: string, fullName?: string, organizationName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || 'Usuário',
        organization_name: organizationName || 'Organização Padrão',
        subscription_tier: 'free'
      }
    }
  });
  return { data, error };
};
```

**O que acontece:**
1. Frontend chama `supabase.auth.signUp()` diretamente
2. Supabase cria o usuário em `auth.users`
3. Supabase retorna um JWT token
4. **Trigger automático no banco** cria profile e vincula à organização:
   ```sql
   -- Função: auto_assign_user_to_default_organization()
   INSERT INTO organization_users (organization_id, user_id, role, status)
   VALUES ('00000000-0000-0000-0000-000000000001', NEW.id, 'user', 'active')
   ```

### 2️⃣ **LOGIN (Fazer Login)**

```typescript
// FRONTEND: frontend/src/hooks/useAuth.ts:78-84
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};
```

**O que acontece:**
1. Frontend chama `supabase.auth.signInWithPassword()`
2. Supabase valida credenciais
3. Supabase retorna JWT token (access_token) + refresh_token
4. Frontend armazena session:
   ```typescript
   {
     access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     refresh_token: "...",
     expires_in: 3600,
     user: { id: "uuid", email: "...", user_metadata: {...} }
   }
   ```

### 3️⃣ **CHAMADAS AO BACKEND (API Requests)**

```typescript
// FRONTEND: Qualquer requisição HTTP
const response = await fetch('https://auzap-backend.onrender.com/api/customers', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
});
```

**O que acontece no Backend:**

```typescript
// BACKEND: backend/src/middleware/auth.ts:19-72
export const authMiddleware = async (req, res, next) => {
  // 1. Extrai token do header Authorization
  const token = req.headers.authorization.substring(7); // Remove "Bearer "

  // 2. VALIDA com Supabase (não cria, apenas valida!)
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  // 3. Extrai organization_id do user_metadata
  const organizationId = user.user_metadata?.organization_id ||
                         '00000000-0000-0000-0000-000000000001';

  // 4. Adiciona dados do usuário na request
  req.user = {
    id: user.id,
    email: user.email,
    organizationId: organizationId,
    role: user.user_metadata?.role || 'user'
  };

  next();
};
```

### 4️⃣ **LOGOUT**

```typescript
// FRONTEND: frontend/src/hooks/useAuth.ts:101-112
const signOut = async () => {
  // Limpa localStorage se estiver em dev mode
  if (import.meta.env.DEV) {
    localStorage.removeItem('auzap_dev_user');
    localStorage.removeItem('auzap_dev_token');
  }

  // Chama Supabase para invalidar token
  const { error } = await supabase.auth.signOut();
  return { error };
};
```

---

## 🎯 Vantagens Dessa Arquitetura

### ✅ **1. Segurança**
- Supabase é especializado em autenticação
- Tokens JWT assinados criptograficamente
- Refresh tokens gerenciados automaticamente
- Rate limiting nativo
- Proteção contra ataques comuns (CSRF, XSS)

### ✅ **2. Menos Código para Manter**
- Backend não precisa:
  - Criar sistema de hash de senhas
  - Gerenciar sessões
  - Implementar refresh token logic
  - Lidar com recuperação de senha
  - Implementar email verification

### ✅ **3. Escalabilidade**
- Supabase Auth é distribuído globalmente
- Gerencia milhões de usuários
- CDN para performance

### ✅ **4. Features Prontas**
- OAuth (Google, GitHub, etc.)
- Magic Links
- Phone Auth (SMS)
- MFA (Multi-Factor Authentication)
- Email verification automática

---

## 🔑 Organization ID Padrão

### Por Que `00000000-0000-0000-0000-000000000001`?

```typescript
// backend/src/middleware/auth.ts:52-54
if (!organizationId) {
  organizationId = '00000000-0000-0000-0000-000000000001';
}
```

**Razões:**
1. **Onboarding Simples**: Usuário pode começar sem criar organização
2. **Desenvolvimento**: Facilita testes locais
3. **Fallback Seguro**: Garante que sempre há um organization_id válido
4. **Migration Path**: Usuários podem migrar para org própria depois

**Como funciona:**
```sql
-- Banco de dados tem essa organização pré-criada
INSERT INTO organizations (id, name, subscription_tier)
VALUES ('00000000-0000-0000-0000-000000000001', 'PetShop Exemplo', 'premium');

-- Trigger adiciona novos users automaticamente
CREATE TRIGGER auto_assign_to_default_org
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_assign_user_to_default_organization();
```

---

## 🛠️ Modo Dev no Frontend

### Para Desenvolvimento Local

```typescript
// frontend/src/hooks/useAuth.ts:16-46
const checkDevAuth = () => {
  const devUser = localStorage.getItem('auzap_dev_user');
  const devToken = localStorage.getItem('auzap_dev_token');

  if (devUser && devToken && import.meta.env.DEV) {
    // Cria mock user sem chamar Supabase
    const mockUser = JSON.parse(devUser);
    setUser(mockUser);
    setSession({ access_token: devToken, ... });
    return true;
  }
  return false;
};
```

**Como usar:**
```javascript
// No console do navegador (dev mode):
localStorage.setItem('auzap_dev_user', JSON.stringify({
  id: 'dev-user-123',
  email: 'dev@auzap.com',
  name: 'Dev User',
  role: 'admin'
}));
localStorage.setItem('auzap_dev_token', 'dev-token-123');

// Reload a página
location.reload();
```

**⚠️ Importante:** Só funciona em `import.meta.env.DEV === true`

---

## 🔄 Diagrama do Fluxo

```
┌─────────────┐
│  FRONTEND   │
│  (React)    │
└──────┬──────┘
       │
       │ 1. signUp/signIn
       ↓
┌─────────────────┐
│ SUPABASE AUTH   │  ← Gerencia TUDO de autenticação
│  (JWT Provider) │
└──────┬──────────┘
       │
       │ 2. Retorna JWT token
       ↓
┌─────────────┐
│  FRONTEND   │
│  stores     │  ← Armazena session.access_token
│  session    │
└──────┬──────┘
       │
       │ 3. Cada request HTTP
       │    Authorization: Bearer <token>
       ↓
┌─────────────────┐
│  BACKEND API    │
│  authMiddleware │  ← Valida token com Supabase
└──────┬──────────┘
       │
       │ 4. supabase.auth.getUser(token)
       ↓
┌─────────────────┐
│ SUPABASE AUTH   │  ← Valida e retorna user data
└──────┬──────────┘
       │
       │ 5. user + organization_id
       ↓
┌─────────────────┐
│  BACKEND API    │
│  Route Handler  │  ← Processa request com req.user
└─────────────────┘
```

---

## 📚 Referências no Código

### Frontend
- **Auth Hook**: `frontend/src/hooks/useAuth.ts`
- **Auth Store**: `frontend/src/stores/authStore.ts`
- **Auth Context**: `frontend/src/contexts/AuthContext.tsx`

### Backend
- **Auth Middleware**: `backend/src/middleware/auth.ts`
- **Tenant Isolation**: `backend/src/middleware/tenant-isolation.ts`
- **Server Setup**: `backend/src/server.ts`

### Database
- **Triggers**: Ver SQL query com `EXECUTE FUNCTION auto_assign_user_to_default_organization`
- **RLS Policies**: Ver `pg_policies` para profiles, organizations, organization_users
- **Helper Functions**: `get_user_organization_id()`, `user_belongs_to_organization()`

---

## 🎓 Conclusão

**O backend NÃO tem rotas de auth próprias porque isso é INTENCIONAL e CORRETO.**

- ✅ Supabase Auth cuida de autenticação
- ✅ Backend cuida de validação e autorização
- ✅ Arquitetura moderna, segura e escalável
- ✅ Menos código para manter
- ✅ Mais features prontas

**Essa é a melhor prática para aplicações modernas!** 🚀
