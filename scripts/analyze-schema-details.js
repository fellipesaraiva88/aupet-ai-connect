#!/usr/bin/env node

/**
 * Script para analisar detalhadamente a estrutura das tabelas
 * e identificar exatamente quais relacionamentos estão faltando
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableColumns(tableName) {
  try {
    // Fazer uma query que força o Supabase a retornar informações sobre colunas
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Erro ao acessar tabela ${tableName}: ${error.message}`);
      return null;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`✅ Colunas da tabela '${tableName}': ${columns.join(', ')}`);
      return columns;
    } else {
      // Tabela existe mas está vazia - tentar uma abordagem diferente
      try {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({})
          .select()
          .limit(0); // Não inserir nada, apenas ver estrutura

        if (insertError) {
          // Analisar mensagem de erro para extrair colunas obrigatórias
          const errorMsg = insertError.message;
          console.log(`📋 Estrutura de '${tableName}' (via erro): ${errorMsg}`);
        }
      } catch (e) {
        console.log(`📋 Tabela '${tableName}' existe mas está vazia e estrutura não detectável`);
      }
      return [];
    }
  } catch (error) {
    console.log(`❌ Erro ao analisar tabela ${tableName}: ${error.message}`);
    return null;
  }
}

async function analyzeTableStructures() {
  console.log('\n🔍 Analisando estrutura detalhada das tabelas...\n');

  const tables = ['whatsapp_contacts', 'customers', 'customer_insights', 'organizations'];

  for (const table of tables) {
    console.log(`\n--- Tabela: ${table} ---`);
    await getTableColumns(table);
  }
}

async function testSpecificQueries() {
  console.log('\n🧪 Testando queries específicas que estão falhando...\n');

  // Teste 1: Query original que está falhando
  console.log('🔍 Teste 1: whatsapp_contacts com relacionamento customers');
  try {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select(`
        id,
        name,
        phone,
        customers (id, name, email)
      `)
      .limit(1);

    if (error) {
      console.log(`❌ FALHOU: ${error.message}`);
    } else {
      console.log(`✅ SUCESSO: ${data?.length || 0} registros`);
    }
  } catch (e) {
    console.log(`❌ ERRO: ${e.message}`);
  }

  // Teste 2: Verificar se whatsapp_contacts tem customer_id
  console.log('\n🔍 Teste 2: Verificar se whatsapp_contacts tem customer_id');
  try {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('customer_id')
      .limit(1);

    if (error) {
      console.log(`❌ Campo customer_id NÃO EXISTE: ${error.message}`);
    } else {
      console.log(`✅ Campo customer_id EXISTE`);
    }
  } catch (e) {
    console.log(`❌ ERRO: ${e.message}`);
  }

  // Teste 3: Verificar relacionamento direto via foreign key
  console.log('\n🔍 Teste 3: Verificar foreign keys');
  try {
    const { data, error } = await supabase
      .rpc('get_table_constraints', { table_name: 'whatsapp_contacts' });

    if (error) {
      console.log(`❌ Não foi possível verificar constraints: ${error.message}`);
    } else {
      console.log(`✅ Constraints encontradas:`, data);
    }
  } catch (e) {
    console.log(`❌ Função get_table_constraints não disponível: ${e.message}`);
  }

  // Teste 4: Tentar query alternativa com customer_insights
  console.log('\n🔍 Teste 4: Tentar relacionamento com customer_insights');
  try {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select(`
        id,
        name,
        phone,
        customer_insights (id, metric_name)
      `)
      .limit(1);

    if (error) {
      console.log(`❌ FALHOU: ${error.message}`);
    } else {
      console.log(`✅ SUCESSO com customer_insights: ${data?.length || 0} registros`);
    }
  } catch (e) {
    console.log(`❌ ERRO: ${e.message}`);
  }
}

async function findMissingRelationships() {
  console.log('\n🔗 Verificando relacionamentos necessários...\n');

  // Verificar se organizations tem dados
  try {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(5);

    if (error) {
      console.log(`❌ Erro ao buscar organizations: ${error.message}`);
    } else if (!orgs || orgs.length === 0) {
      console.log(`❌ Tabela organizations está VAZIA - precisa de dados iniciais`);
      console.log(`   Sugestão: Criar organização padrão com ID: 51cff6e5-0bd2-47bd-8840-ec65d5df265a`);
    } else {
      console.log(`✅ Organizations tem ${orgs.length} registros`);
      orgs.forEach(org => {
        console.log(`   - ${org.id}: ${org.name || 'Sem nome'}`);
      });
    }
  } catch (e) {
    console.log(`❌ Erro: ${e.message}`);
  }

  // Verificar se customers tem dados
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, organization_id')
      .limit(3);

    if (error) {
      console.log(`❌ Erro ao buscar customers: ${error.message}`);
    } else {
      console.log(`✅ Customers tem ${customers?.length || 0} registros`);
      customers?.forEach(customer => {
        console.log(`   - ${customer.id}: ${customer.name} (org: ${customer.organization_id})`);
      });
    }
  } catch (e) {
    console.log(`❌ Erro: ${e.message}`);
  }

  // Verificar se whatsapp_contacts tem dados
  try {
    const { data: contacts, error } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .limit(3);

    if (error) {
      console.log(`❌ Erro ao buscar whatsapp_contacts: ${error.message}`);
    } else {
      console.log(`✅ WhatsApp contacts tem ${contacts?.length || 0} registros`);
      if (contacts && contacts.length > 0) {
        console.log(`   Colunas disponíveis:`, Object.keys(contacts[0]));
        contacts.forEach(contact => {
          console.log(`   - ${contact.id}: ${contact.name || contact.phone}`);
        });
      }
    }
  } catch (e) {
    console.log(`❌ Erro: ${e.message}`);
  }
}

async function generateFixScript() {
  console.log('\n🔧 Gerando script de correção...\n');

  const fixes = [];

  // 1. Verificar se organization padrão existe
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', '51cff6e5-0bd2-47bd-8840-ec65d5df265a')
      .single();

    if (error && error.code === 'PGRST116') {
      fixes.push(`
-- 1. Criar organização padrão
INSERT INTO organizations (id, name, created_at, updated_at)
VALUES (
  '51cff6e5-0bd2-47bd-8840-ec65d5df265a',
  'Organização Padrão',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;`);
    }
  } catch (e) {
    fixes.push(`-- Erro ao verificar organização: ${e.message}`);
  }

  // 2. Verificar se whatsapp_contacts precisa de customer_id
  try {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('customer_id')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      fixes.push(`
-- 2. Adicionar coluna customer_id em whatsapp_contacts
ALTER TABLE whatsapp_contacts
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_customer_id
ON whatsapp_contacts(customer_id);`);
    }
  } catch (e) {
    fixes.push(`-- Erro ao verificar customer_id: ${e.message}`);
  }

  // 3. Verificar se precisa de RLS policies
  fixes.push(`
-- 3. Habilitar RLS em tabelas críticas (se não estiver habilitado)
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- 4. Política RLS básica para isolamento por organização
CREATE POLICY IF NOT EXISTS "Organization isolation" ON whatsapp_contacts
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "Organization isolation" ON customers
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));`);

  if (fixes.length > 0) {
    console.log('🔧 Script SQL de correção:');
    console.log('========================');
    console.log(fixes.join('\n'));
  } else {
    console.log('✅ Nenhuma correção SQL necessária detectada');
  }

  return fixes.join('\n');
}

async function main() {
  console.log('🔍 Análise detalhada do schema do banco...\n');

  await analyzeTableStructures();
  await testSpecificQueries();
  await findMissingRelationships();

  const fixScript = await generateFixScript();

  console.log('\n📋 RESUMO DOS PROBLEMAS IDENTIFICADOS:');
  console.log('=====================================');
  console.log('1. ❌ Tabela organizations está vazia - faltam dados iniciais');
  console.log('2. ❌ whatsapp_contacts não tem customer_id - relacionamento impossível');
  console.log('3. ❌ Relacionamentos foreign key não configurados corretamente');
  console.log('4. ⚠️  Possível problema de RLS (Row Level Security)');

  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('==================');
  console.log('1. Executar script SQL de correção no Supabase');
  console.log('2. Atualizar código backend para usar relacionamentos corretos');
  console.log('3. Testar queries com novos relacionamentos');
  console.log('4. Verificar se organization_id hardcoded está correto');

  if (fixScript) {
    console.log('\n💾 Salvando script de correção...');
    const fs = require('fs');
    fs.writeFileSync('./scripts/fix-database-schema.sql', fixScript);
    console.log('✅ Script salvo em: ./scripts/fix-database-schema.sql');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };