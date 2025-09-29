import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
  try {
    console.log('🔍 Buscando usuários cadastrados...\n');

    // Buscar usuários da view admin_user_stats
    const { data: users, error: usersError } = await supabase
      .from('admin_user_stats')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);

      // Tentar buscar direto da tabela profiles
      console.log('\n🔄 Tentando buscar da tabela profiles...\n');

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          organization_id,
          created_at,
          last_sign_in_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ Erro ao buscar profiles:', profilesError);
        return;
      }

      console.log(`✅ Encontrados ${profiles?.length || 0} usuários:\n`);

      profiles?.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name || 'Sem nome'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role || 'user'}`);
        console.log(`   Org ID: ${user.organization_id}`);
        console.log(`   Criado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}`);
        console.log('');
      });

      return;
    }

    console.log(`✅ Encontrados ${users?.length || 0} usuários:\n`);

    users?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || user.email}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   Organização: ${user.organization_name || user.organization_id}`);
      console.log(`   Status: ${user.is_active ? '🟢 Ativo' : '🔴 Inativo'}`);
      console.log(`   Conversas: ${user.conversations_count || 0}`);
      console.log(`   Mensagens: ${user.messages_count || 0}`);
      console.log(`   WhatsApp: ${user.whatsapp_instances_count || 0} instâncias`);
      console.log(`   Criado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}`);
      console.log('');
    });

    // Estatísticas gerais
    console.log('\n📊 Estatísticas Gerais:');
    console.log(`   Total de usuários: ${users?.length || 0}`);
    console.log(`   Ativos: ${users?.filter(u => u.is_active).length || 0}`);
    console.log(`   Inativos: ${users?.filter(u => !u.is_active).length || 0}`);
    console.log(`   Com WhatsApp: ${users?.filter(u => (u.whatsapp_instances_count || 0) > 0).length || 0}`);
    console.log(`   Super admins: ${users?.filter(u => u.role === 'super_admin').length || 0}`);
    console.log(`   Admins: ${users?.filter(u => u.role === 'admin').length || 0}`);
    console.log(`   Usuários: ${users?.filter(u => u.role === 'user' || !u.role).length || 0}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

listUsers();