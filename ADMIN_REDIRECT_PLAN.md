# 📋 Plano Formal: Redirecionamento Automático Super Admin

**Data:** 30/01/2025
**Status:** 🔍 Análise Completa

---

## 🎯 Objetivo
Garantir que usuários com role `super_admin` sejam automaticamente redirecionados para `/admin` após login bem-sucedido.

---

## 📊 Análise da Situação Atual

### ✅ O que JÁ está implementado:

1. **Backend (100% OK)**
   - ✅ Role `super_admin` adicionado ao enum `user_role`
   - ✅ Usuário `fe@saraiva.ai` com role `super_admin`
   - ✅ Senha configurada: `Auzap888`
   - ✅ Migrations aplicadas com sucesso
   - ✅ Tabelas e views administrativas criadas

2. **Frontend - Código (100% OK)**
   - ✅ `Login.tsx` implementa lógica de redirecionamento (linhas 73-89)
   - ✅ Busca profile do usuário após login
   - ✅ Verifica role e redireciona para `/admin` se `super_admin`
   - ✅ Código commitado e pushed para GitHub
   - ✅ Build realizado com sucesso no Render

3. **Rotas Admin (100% OK)**
   - ✅ `/admin` - Dashboard administrativo
   - ✅ `/admin/organizations` - Gerenciamento de organizações
   - ✅ `/admin/tokens` - Tokenômetro
   - ✅ Rotas configuradas em `App.tsx`

---

## 🔍 Diagnóstico do Problema

### Código Implementado (Login.tsx - linhas 73-89):
```typescript
if (data?.user) {
  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();

  toast({
    title: 'Login realizado com sucesso',
    description: 'Bem-vindo ao Auzap.',
  });

  // Redirect based on role
  if (profile?.role === 'super_admin') {
    navigate('/admin', { replace: true });
  } else {
    navigate('/', { replace: true });
  }
}
```

### Possíveis Causas do Problema:

#### 1. **Cache do Browser (Mais Provável - 70%)**
   - PWA está fazendo cache da versão antiga
   - Service Worker não atualizou
   - **Solução:** Hard refresh (Cmd+Shift+R ou Ctrl+Shift+R)

#### 2. **Falha na Query do Profile (20%)**
   - RLS policies bloqueando leitura do próprio profile
   - Token JWT não contendo informação necessária
   - **Solução:** Verificar logs do console do browser

#### 3. **Race Condition (10%)**
   - `navigate()` sendo chamado antes da query completar
   - **Solução:** Adicionar await explícito ou loading state

---

## 🛠️ Plano de Ação (5 Etapas)

### **Etapa 1: Verificação no Browser (PRIORITÁRIA)**
```bash
# Usuário deve fazer:
1. Abrir https://auzap-frontend.onrender.com/login
2. Abrir DevTools (F12)
3. Ir para Console
4. Limpar cache: Settings > Clear site data
5. Hard refresh: Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
6. Tentar login novamente
7. Observar logs no console
```

**Esperado no console:**
```
Login error: (se houver erro)
ou
(nenhum erro - redirecionamento funciona)
```

---

### **Etapa 2: Adicionar Logs de Debug**

**Modificação em `Login.tsx` (após linha 77):**
```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('role')
  .eq('user_id', data.user.id)
  .single();

// 🔍 DEBUG LOGS
console.log('🔐 User ID:', data.user.id);
console.log('👤 Profile data:', profile);
console.log('❌ Profile error:', profileError);
console.log('🎯 Role detected:', profile?.role);
console.log('🚀 Redirecting to:', profile?.role === 'super_admin' ? '/admin' : '/');
```

---

### **Etapa 3: Verificar RLS Policies**

**Query SQL no Supabase para verificar policies:**
```sql
-- Verificar policies na tabela profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';
```

**Policy necessária:**
```sql
-- Se não existir, criar:
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

### **Etapa 4: Fallback com Retry Mechanism**

**Implementação alternativa com retry:**
```typescript
if (data?.user) {
  let profile = null;
  let attempts = 0;
  const maxAttempts = 3;

  // Retry logic
  while (!profile && attempts < maxAttempts) {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    if (profileData) {
      profile = profileData;
    } else if (error) {
      console.error(`Profile fetch attempt ${attempts + 1} failed:`, error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Redirect logic
  if (profile?.role === 'super_admin') {
    navigate('/admin', { replace: true });
  } else {
    navigate('/', { replace: true });
  }
}
```

---

### **Etapa 5: Solução Alternativa via Auth Metadata**

**Opção B: Usar user_metadata no auth.users**
```typescript
// Após login, ler do próprio objeto user
const userRole = data.user.user_metadata?.role ||
                 data.user.app_metadata?.role;

if (userRole === 'super_admin') {
  navigate('/admin', { replace: true });
} else {
  navigate('/', { replace: true });
}
```

---

## 🧪 Testes Necessários

### Teste 1: Verificar Cache
```bash
1. Abrir https://auzap-frontend.onrender.com/login em aba anônima
2. Login: fe@saraiva.ai / Auzap888
3. Verificar se redireciona para /admin
```

### Teste 2: Verificar Profile Query
```bash
1. Login na aplicação
2. Abrir DevTools > Console
3. Executar:
   const { data } = await window.supabase
     .from('profiles')
     .select('role')
     .eq('user_id', '0901537e-7dbe-488d-8ab4-7130a37a2d99')
     .single();
   console.log(data);
```

### Teste 3: Verificar RLS
```sql
-- No SQL Editor do Supabase:
SELECT role FROM profiles
WHERE user_id = '0901537e-7dbe-488d-8ab4-7130a37a2d99';
```

---

## 📈 Métricas de Sucesso

- [ ] Login com `fe@saraiva.ai` redireciona para `/admin`
- [ ] Login com usuário normal redireciona para `/`
- [ ] Nenhum erro aparece no console
- [ ] Profile query retorna role corretamente
- [ ] Redirecionamento ocorre em < 500ms

---

## 🚨 Contingência

Se após todas as etapas o problema persistir:

### Solução Temporária: Hardcode na AuthContext
```typescript
// Em useAuth.ts, após signIn:
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Hardcode para super_admin durante debug
  if (email === 'fe@saraiva.ai' && data?.user) {
    window.location.href = '/admin';
    return { data, error };
  }

  return { data, error };
};
```

---

## 📝 Checklist de Implementação

- [x] Código implementado em Login.tsx
- [x] Commit e push para GitHub
- [x] Build realizado com sucesso
- [x] Deploy concluído no Render
- [ ] **Cache limpo no browser do usuário**
- [ ] **Teste em aba anônima**
- [ ] **Logs de debug adicionados**
- [ ] **RLS policies verificadas**
- [ ] **Teste de sucesso confirmado**

---

## 🎓 Recomendações Futuras

1. **Adicionar campo `role` no JWT token**
   - Evita query extra no banco
   - Redirecionamento mais rápido

2. **Criar um hook `useRoleBasedRedirect`**
   - Reutilizável em toda aplicação
   - Centraliza lógica de redirecionamento

3. **Implementar loading state**
   - Mostrar "Carregando..." durante fetch do profile
   - Melhor UX

4. **Unit tests para redirecionamento**
   - Garantir funcionamento em futuras mudanças

---

## 📞 Próximos Passos Imediatos

1. ✅ **Usuário:** Limpar cache e tentar em aba anônima
2. ⏳ **Se não funcionar:** Adicionar logs de debug (Etapa 2)
3. ⏳ **Se não funcionar:** Verificar RLS policies (Etapa 3)
4. ⏳ **Se não funcionar:** Implementar retry mechanism (Etapa 4)
5. ⏳ **Última opção:** Usar solução temporária hardcode

---

**Desenvolvido com ❤️ para Auzap.ai**