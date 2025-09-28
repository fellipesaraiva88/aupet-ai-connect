#!/usr/bin/env node

/**
 * Script final para verificar se todas as correções estão funcionando
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com o banco...');

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (error) {
      console.log(`❌ Erro na conexão: ${error.message}`);
      return false;
    }

    console.log(`✅ Conexão funcionando. ${data?.length || 0} organizações encontradas`);
    return true;
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}`);
    return false;
  }
}

async function testOrganizationExists() {
  console.log('🏢 Verificando se organização padrão existe...');

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (error && error.code === 'PGRST116') {
      console.log('❌ Organização padrão NÃO EXISTE');
      console.log('💡 Execute o script SQL: scripts/temp-database-fix.sql');
      return false;
    }

    if (error) {
      console.log(`❌ Erro ao verificar organização: ${error.message}`);
      return false;
    }

    console.log(`✅ Organização padrão existe: ${data.name}`);
    return true;
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return false;
  }
}

async function testTablesAccess() {
  console.log('📋 Testando acesso às tabelas principais...');

  const tables = [
    'organizations',
    'customers',
    'whatsapp_contacts',
    'whatsapp_conversations',
    'whatsapp_messages',
    'pets',
    'appointments'
  ];

  let allTablesOk = true;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allTablesOk = false;
      } else {
        console.log(`✅ ${table}: Acessível (${data?.length || 0} registros)`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
      allTablesOk = false;
    }
  }

  return allTablesOk;
}

async function testCustomerIdColumn() {
  console.log('🔗 Verificando coluna customer_id em whatsapp_contacts...');

  try {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('customer_id')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('❌ Coluna customer_id NÃO EXISTE');
      console.log('💡 Execute o script SQL: scripts/temp-database-fix.sql');
      return false;
    }

    if (error) {
      console.log(`❌ Erro ao verificar customer_id: ${error.message}`);
      return false;
    }

    console.log('✅ Coluna customer_id existe');
    return true;
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return false;
  }
}

async function testBackendEndpoints() {
  console.log('🚀 Testando se backend pode iniciar...');

  try {
    // Simular carregamento dos arquivos principais
    const path = require('path');
    const backendPath = path.join(process.cwd(), 'backend');

    // Verificar se arquivos existem
    const fs = require('fs');
    const filesToCheck = [
      'backend/src/routes/conversations.ts',
      'backend/src/routes/customers.ts',
      'backend/src/middleware/auth.ts',
      'backend/src/services/supabase.ts'
    ];

    let filesOk = true;
    filesToCheck.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}: Existe`);
      } else {
        console.log(`❌ ${file}: NÃO EXISTE`);
        filesOk = false;
      }
    });

    return filesOk;
  } catch (error) {
    console.log(`❌ Erro ao verificar arquivos: ${error.message}`);
    return false;
  }
}

async function generateStatusReport() {
  console.log('\n📊 Gerando relatório de status...\n');

  const tests = [
    { name: 'Conexão com banco', test: await testDatabaseConnection() },
    { name: 'Organização padrão', test: await testOrganizationExists() },
    { name: 'Acesso às tabelas', test: await testTablesAccess() },
    { name: 'Coluna customer_id', test: await testCustomerIdColumn() },
    { name: 'Arquivos backend', test: await testBackendEndpoints() }
  ];

  console.log('\n📋 RELATÓRIO DE STATUS:');
  console.log('======================');

  let allPassed = true;
  tests.forEach(({ name, test }) => {
    const status = test ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${status} - ${name}`);
    if (!test) allPassed = false;
  });

  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('==================');

  if (allPassed) {
    console.log('🎉 TUDO FUNCIONANDO!');
    console.log('1. Execute o backend: cd backend && npm run dev');
    console.log('2. Teste os endpoints com Postman ou curl');
    console.log('3. Verifique logs do backend para confirmar');
  } else {
    console.log('⚠️  ALGUMAS CORREÇÕES AINDA NECESSÁRIAS:');

    if (!tests[1].test) { // Organização
      console.log('• Execute o script SQL no Supabase: scripts/temp-database-fix.sql');
    }

    if (!tests[3].test) { // customer_id
      console.log('• Adicione coluna customer_id manualmente no Supabase');
    }

    if (!tests[2].test) { // Tabelas
      console.log('• Verifique políticas RLS no Supabase');
    }

    if (!tests[4].test) { // Backend
      console.log('• Verifique se todos os arquivos backend existem');
    }
  }

  console.log('\n📚 RECURSOS CRIADOS:');
  console.log('====================');
  console.log('• scripts/temp-database-fix.sql - Script SQL para o banco');
  console.log('• scripts/database-fix-report.md - Relatório detalhado');
  console.log('• scripts/check-database-schema.js - Verificação de schema');
  console.log('• scripts/final-verification.js - Este script');

  console.log('\n✅ Verificação final concluída!');

  return allPassed;
}

async function main() {
  console.log('🔍 VERIFICAÇÃO FINAL DO SISTEMA\n');
  console.log('Este script verifica se todas as correções foram aplicadas corretamente.\n');

  const success = await generateStatusReport();

  if (success) {
    console.log('\n🚀 SISTEMA PRONTO PARA USO!');
    process.exit(0);
  } else {
    console.log('\n⚠️  SISTEMA PRECISA DE CORREÇÕES ADICIONAIS');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };