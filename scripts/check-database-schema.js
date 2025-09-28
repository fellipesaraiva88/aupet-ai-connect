#!/usr/bin/env node

/**
 * Script para verificar o schema atual do banco Supabase
 * e identificar os problemas de relacionamento mencionados nos logs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente Supabase não encontradas');
  console.error('Certifique-se de que SUPABASE_URL e SUPABASE_ANON_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Tabela '${tableName}' não existe ou não acessível: ${error.message}`);
      return false;
    }

    console.log(`✅ Tabela '${tableName}' existe e é acessível`);
    return true;
  } catch (error) {
    console.log(`❌ Erro ao verificar tabela '${tableName}': ${error.message}`);
    return false;
  }
}

async function checkTableRelationships() {
  console.log('\n🔍 Verificando relacionamentos entre tabelas...\n');

  // Verificar relacionamento whatsapp_contacts -> customers
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
      console.log(`❌ Relacionamento whatsapp_contacts -> customers: ${error.message}`);

      // Verificar se existe customer_insights em vez de customers
      try {
        const { data: altData, error: altError } = await supabase
          .from('whatsapp_contacts')
          .select(`
            id,
            name,
            phone,
            customer_insights (id, customer_id)
          `)
          .limit(1);

        if (!altError) {
          console.log(`✅ Relacionamento alternativo encontrado: whatsapp_contacts -> customer_insights`);
        } else {
          console.log(`❌ Relacionamento alternativo customer_insights também falhou: ${altError.message}`);
        }
      } catch (e) {
        console.log(`❌ Erro ao verificar customer_insights: ${e.message}`);
      }
    } else {
      console.log(`✅ Relacionamento whatsapp_contacts -> customers funcionando`);
    }
  } catch (error) {
    console.log(`❌ Erro geral ao verificar relacionamentos: ${error.message}`);
  }
}

async function listAllTables() {
  console.log('\n📋 Verificando tabelas principais do sistema...\n');

  const coreTables = [
    'organizations',
    'customers',
    'customer_insights',
    'whatsapp_contacts',
    'whatsapp_conversations',
    'whatsapp_messages',
    'whatsapp_instances',
    'pets',
    'appointments',
    'ai_configurations',
    'petshop_settings'
  ];

  const existingTables = [];
  const missingTables = [];

  for (const table of coreTables) {
    const exists = await checkTableExists(table);
    if (exists) {
      existingTables.push(table);
    } else {
      missingTables.push(table);
    }
  }

  console.log('\n📊 Resumo do Schema:');
  console.log(`✅ Tabelas existentes (${existingTables.length}): ${existingTables.join(', ')}`);
  console.log(`❌ Tabelas ausentes (${missingTables.length}): ${missingTables.join(', ')}`);

  return { existingTables, missingTables };
}

async function checkOrganizationIds() {
  console.log('\n🏢 Verificando IDs de organização...\n');

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);

    if (error) {
      console.log(`❌ Erro ao buscar organizações: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Organizações encontradas:');
      data.forEach(org => {
        console.log(`   - ${org.id} (${org.name || 'Sem nome'})`);
      });

      // Verificar se o ID hardcoded "51cff6e5-0bd2-47bd-8840-ec65d5df265a" existe
      const hardcodedId = '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
      const orgExists = data.find(org => org.id === hardcodedId);

      if (orgExists) {
        console.log(`✅ Organização hardcoded encontrada: ${hardcodedId}`);
      } else {
        console.log(`❌ Organização hardcoded NÃO encontrada: ${hardcodedId}`);
        console.log('   Isso pode causar erros UUID nos logs');
      }
    } else {
      console.log('❌ Nenhuma organização encontrada');
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar organizações: ${error.message}`);
  }
}

async function checkSchemaConsistency() {
  console.log('\n🔧 Verificando consistência do schema...\n');

  // Verificar se whatsapp_contacts tem customer_id
  try {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('customer_id')
      .limit(1);

    if (error) {
      console.log(`❌ Campo customer_id não existe em whatsapp_contacts: ${error.message}`);
    } else {
      console.log(`✅ Campo customer_id existe em whatsapp_contacts`);
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar customer_id: ${error.message}`);
  }

  // Verificar estrutura de customers vs customer_insights
  console.log('\n🔍 Comparando estruturas customers vs customer_insights...');

  const customersSchema = await getTableSchema('customers');
  const customerInsightsSchema = await getTableSchema('customer_insights');

  if (customersSchema && customerInsightsSchema) {
    console.log('📊 Ambas as tabelas existem - possível duplicação ou migração incompleta');
  } else if (customersSchema && !customerInsightsSchema) {
    console.log('✅ Apenas tabela customers existe - schema correto');
  } else if (!customersSchema && customerInsightsSchema) {
    console.log('⚠️  Apenas customer_insights existe - pode precisar renomear para customers');
  } else {
    console.log('❌ Nenhuma das tabelas de clientes existe');
  }
}

async function getTableSchema(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0); // Apenas para verificar se existe

    return !error;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando verificação do schema do banco Supabase...');
  console.log(`🔗 URL: ${supabaseUrl}`);
  console.log(`🔑 Usando chave: ${supabaseKey.substring(0, 20)}...`);

  try {
    // 1. Verificar tabelas principais
    const { existingTables, missingTables } = await listAllTables();

    // 2. Verificar relacionamentos problemáticos
    await checkTableRelationships();

    // 3. Verificar IDs de organização
    await checkOrganizationIds();

    // 4. Verificar consistência do schema
    await checkSchemaConsistency();

    console.log('\n📋 Sumário dos Problemas Identificados:');
    console.log('==========================================');

    if (missingTables.length > 0) {
      console.log(`❌ Tabelas ausentes: ${missingTables.join(', ')}`);
    }

    // Sugerir ações corretivas
    console.log('\n🔧 Ações Recomendadas:');
    console.log('======================');

    if (missingTables.includes('customers') && existingTables.includes('customer_insights')) {
      console.log('1. Considere renomear customer_insights para customers');
      console.log('2. Ou ajuste o código para usar customer_insights');
    }

    if (missingTables.includes('whatsapp_contacts')) {
      console.log('3. Criar tabela whatsapp_contacts conforme especificação');
    }

    console.log('4. Verificar e corrigir relacionamentos entre tabelas');
    console.log('5. Criar organização padrão se necessário');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }

  console.log('\n✅ Verificação do schema concluída!');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkTableExists, checkTableRelationships };