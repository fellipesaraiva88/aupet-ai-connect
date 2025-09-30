import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios!');
  console.error(`   SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`);
  console.error(`   SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? '✓' : '✗'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface UserToCreate {
  email: string;
  password: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'recepcao' | 'medico';
}

const USERS_TO_CREATE: UserToCreate[] = [
  // Super Admins
  { email: 'fe@auzap.com.br', password: 'Auzap888', full_name: 'Felipe Saraiva', role: 'super_admin' },
  { email: 'arthur@auzap.com.br', password: 'Auzap888', full_name: 'Arthur Auzap', role: 'super_admin' },
  { email: 'julio@auzap.com.br', password: 'Auzap888', full_name: 'Julio Auzap', role: 'super_admin' },
  { email: 'estevao@auzap.com.br', password: 'Auzap888', full_name: 'Estevão Auzap', role: 'super_admin' },

  // Admins
  { email: 'leo@auzap.com.br', password: 'Auzap888', full_name: 'Leo Auzap', role: 'admin' },
  { email: 'joaquim@auzap.com.br', password: 'Auzap888', full_name: 'Joaquim Auzap', role: 'admin' },
  { email: 'leticia@auzap.com.br', password: 'Auzap888', full_name: 'Letícia Auzap', role: 'admin' },

  // Usuário Teste
  { email: 'teste@auzap.com.br', password: 'AuzapTeste!', full_name: 'Usuário Teste', role: 'recepcao' },
];

async function deleteAllUsers() {
  console.log('🗑️  Deletando todos os usuários existentes...\n');

  try {
    // 1. Buscar todos os usuários do profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email');

    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('✅ Nenhum usuário encontrado para deletar.\n');
      return;
    }

    console.log(`📋 Encontrados ${profiles.length} usuários para deletar:\n`);
    profiles.forEach((p, i) => console.log(`   ${i + 1}. ${p.email} (${p.id})`));
    console.log('');

    // 2. Deletar cada usuário do Auth
    for (const profile of profiles) {
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(profile.id);

        if (authError) {
          console.error(`   ❌ Erro ao deletar ${profile.email} do Auth:`, authError.message);
          continue;
        }

        // 3. Deletar do profiles (pode já ter sido deletado via trigger, mas garante)
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error(`   ❌ Erro ao deletar profile ${profile.email}:`, profileError.message);
        } else {
          console.log(`   ✅ Deletado: ${profile.email}`);
        }
      } catch (error: any) {
        console.error(`   ❌ Erro ao processar ${profile.email}:`, error.message);
      }
    }

    console.log('\n✅ Todos os usuários foram deletados!\n');
  } catch (error: any) {
    console.error('❌ Erro geral ao deletar usuários:', error);
    throw error;
  }
}

async function ensureAuzapOrganization(): Promise<string> {
  console.log('🏢 Garantindo que organização Auzap existe...\n');

  try {
    // Verificar se já existe
    const { data: existing, error: searchError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', 'Auzap')
      .maybeSingle();

    if (searchError) {
      console.error('❌ Erro ao buscar organização:', searchError);
      throw searchError;
    }

    if (existing) {
      console.log(`✅ Organização "Auzap" já existe (${existing.id})\n`);
      return existing.id;
    }

    // Criar nova organização
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        name: 'Auzap',
        slug: 'auzap-official',
        subscription_tier: 'enterprise',
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar organização:', createError);
      throw createError;
    }

    console.log(`✅ Organização "Auzap" criada (${newOrg.id})\n`);
    return newOrg.id;
  } catch (error: any) {
    console.error('❌ Erro ao gerenciar organização:', error);
    throw error;
  }
}

async function createUsers(organizationId: string) {
  console.log('👥 Criando novos usuários...\n');

  const results = {
    success: [] as string[],
    failed: [] as string[]
  };

  for (const user of USERS_TO_CREATE) {
    try {
      console.log(`   Criando ${user.email} (${user.role})...`);

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          full_name: user.full_name,
          organization_id: organizationId
        }
      });

      if (authError) {
        console.error(`      ❌ Erro no Auth: ${authError.message}`);
        results.failed.push(user.email);
        continue;
      }

      if (!authData.user) {
        console.error(`      ❌ Usuário não retornado pelo Auth`);
        results.failed.push(user.email);
        continue;
      }

      // 2. Criar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          organization_id: organizationId,
          is_active: true
        });

      if (profileError) {
        console.error(`      ❌ Erro ao criar profile: ${profileError.message}`);
        // Tentar deletar do Auth para manter consistência
        await supabase.auth.admin.deleteUser(authData.user.id);
        results.failed.push(user.email);
        continue;
      }

      console.log(`      ✅ Criado com sucesso!`);
      results.success.push(user.email);
    } catch (error: any) {
      console.error(`      ❌ Erro: ${error.message}`);
      results.failed.push(user.email);
    }
  }

  return results;
}

async function validateUsers() {
  console.log('\n📊 Validando usuários criados...\n');

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('email, full_name, role, organization_id, is_active')
      .order('role', { ascending: true });

    if (error) {
      console.error('❌ Erro ao validar:', error);
      return;
    }

    console.log(`✅ Total de usuários: ${users?.length || 0}\n`);

    const byRole = {
      super_admin: users?.filter(u => u.role === 'super_admin') || [],
      admin: users?.filter(u => u.role === 'admin') || [],
      recepcao: users?.filter(u => u.role === 'recepcao') || [],
      medico: users?.filter(u => u.role === 'medico') || []
    };

    console.log('🔑 Super Admins:');
    byRole.super_admin.forEach(u => console.log(`   - ${u.email} (${u.full_name})`));

    console.log('\n👔 Admins:');
    byRole.admin.forEach(u => console.log(`   - ${u.email} (${u.full_name})`));

    console.log('\n📋 Recepção:');
    byRole.recepcao.forEach(u => console.log(`   - ${u.email} (${u.full_name})`));

    if (byRole.medico.length > 0) {
      console.log('\n⚕️  Médicos:');
      byRole.medico.forEach(u => console.log(`   - ${u.email} (${u.full_name})`));
    }

  } catch (error: any) {
    console.error('❌ Erro na validação:', error);
  }
}

async function main() {
  console.log('🚀 Iniciando Reset de Usuários...\n');
  console.log('⚠️  ATENÇÃO: Esta operação é DESTRUTIVA e IRREVERSÍVEL!\n');
  console.log('   Todos os usuários existentes serão PERMANENTEMENTE deletados.\n');

  try {
    // Fase 1: Deletar todos os usuários
    await deleteAllUsers();

    // Fase 2: Garantir organização Auzap
    const auzapOrgId = await ensureAuzapOrganization();

    // Fase 3: Criar novos usuários
    const results = await createUsers(auzapOrgId);

    // Fase 4: Validar
    await validateUsers();

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✅ RESET CONCLUÍDO COM SUCESSO!\n');
    console.log(`   Usuários criados: ${results.success.length}`);
    console.log(`   Falhas: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log('\n❌ Usuários que falharam:');
      results.failed.forEach(email => console.log(`   - ${email}`));
    }

    console.log('\n📝 Credenciais:');
    console.log('   Super Admins & Admins: Auzap888');
    console.log('   Usuário Teste: AuzapTeste!');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ ERRO FATAL:', error.message);
    process.exit(1);
  }
}

main();