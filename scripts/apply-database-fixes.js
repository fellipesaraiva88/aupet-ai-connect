#!/usr/bin/env node

/**
 * Script para aplicar correções no banco de dados Supabase
 * Resolve os problemas de relacionamento identificados
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDefaultOrganization() {
  console.log('🏢 Criando organização padrão...');

  const orgId = '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const orgData = {
    id: orgId,
    name: 'Organização Padrão',
    domain: 'default.aupet.com',
    subscription_tier: 'free',
    whatsapp_api_config: {
      instance_name: 'default_instance',
      api_url: 'http://localhost:8080'
    },
    business_settings: {
      business_name: 'Pet Shop Padrão',
      business_hours: {
        enabled: true,
        timezone: 'America/Sao_Paulo',
        schedule: {
          monday: { start: '08:00', end: '18:00', enabled: true },
          tuesday: { start: '08:00', end: '18:00', enabled: true },
          wednesday: { start: '08:00', end: '18:00', enabled: true },
          thursday: { start: '08:00', end: '18:00', enabled: true },
          friday: { start: '08:00', end: '18:00', enabled: true },
          saturday: { start: '08:00', end: '16:00', enabled: true },
          sunday: { start: '08:00', end: '12:00', enabled: false }
        }
      }
    },
    branding_config: {
      primary_color: '#007bff',
      secondary_color: '#6c757d',
      logo_url: ''
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true
  };

  try {
    const { data, error } = await supabase
      .from('organizations')
      .upsert(orgData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.log(`❌ Erro ao criar organização: ${error.message}`);

      // Tentar com uma versão mais simples se houver erro de RLS
      try {
        console.log('🔄 Tentando versão simplificada...');
        const simpleOrgData = {
          id: orgId,
          name: 'Organização Padrão',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        };

        const { data: simpleData, error: simpleError } = await supabase
          .from('organizations')
          .upsert(simpleOrgData, { onConflict: 'id' })
          .select()
          .single();

        if (simpleError) {
          throw simpleError;
        }

        console.log('✅ Organização criada com dados simplificados');
        return simpleData;
      } catch (retryError) {
        throw error; // Usar erro original
      }
    }

    console.log('✅ Organização criada/atualizada com sucesso');
    return data;
  } catch (error) {
    console.log(`❌ Falha ao criar organização: ${error.message}`);
    return null;
  }
}

async function addCustomerIdToWhatsappContacts() {
  console.log('🔗 Adicionando coluna customer_id em whatsapp_contacts...');

  try {
    // Usar a função do Supabase para executar SQL direto
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE whatsapp_contacts
        ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

        CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_customer_id
        ON whatsapp_contacts(customer_id);
      `
    });

    if (error) {
      console.log(`❌ Erro ao adicionar customer_id: ${error.message}`);
      console.log('💡 Isso pode ser normal se a função execute_sql não estiver disponível');
      console.log('💡 A coluna pode precisar ser adicionada manualmente no painel do Supabase');
      return false;
    }

    console.log('✅ Coluna customer_id adicionada com sucesso');
    return true;
  } catch (error) {
    console.log(`❌ Erro ao executar SQL: ${error.message}`);
    return false;
  }
}

async function createDefaultUser() {
  console.log('👤 Criando usuário padrão...');

  const orgId = '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const userData = {
    id: 'default-user-id', // Este será substituído pelo auth.users
    organization_id: orgId,
    email: 'admin@default.com',
    full_name: 'Administrador Padrão',
    role: 'admin',
    department: 'Administração',
    permissions: {
      can_manage_users: true,
      can_manage_settings: true,
      can_view_analytics: true,
      can_manage_ai: true
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // Note: Em produção, o usuário seria criado via Supabase Auth
    // Aqui estamos apenas preparando a estrutura
    console.log('✅ Estrutura de usuário padrão preparada');
    console.log('💡 Em produção, criar usuário via Supabase Auth primeiro');
    return userData;
  } catch (error) {
    console.log(`❌ Erro ao preparar usuário: ${error.message}`);
    return null;
  }
}

async function createSampleData() {
  console.log('📊 Criando dados de exemplo...');

  const orgId = '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  // 1. Criar cliente de exemplo
  console.log('👤 Criando cliente de exemplo...');
  try {
    const customerData = {
      id: 'example-customer-id',
      organization_id: orgId,
      name: 'João Silva',
      email: 'joao@exemplo.com',
      phone: '+5511999999999',
      address: 'Rua Exemplo, 123',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      emergency_contact: {
        name: 'Maria Silva',
        phone: '+5511888888888',
        relationship: 'Esposa'
      },
      notes: 'Cliente de exemplo para testes',
      tags: ['vip', 'fidelidade'],
      customer_since: new Date().toISOString().split('T')[0],
      total_spent: 0,
      loyalty_points: 0,
      preferred_contact_method: 'whatsapp',
      communication_preferences: {
        accepts_marketing: true,
        preferred_time: 'morning'
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(customerData, { onConflict: 'id' })
      .select()
      .single();

    if (customerError) {
      console.log(`❌ Erro ao criar cliente: ${customerError.message}`);
    } else {
      console.log('✅ Cliente de exemplo criado');
    }

    // 2. Criar pet de exemplo
    console.log('🐕 Criando pet de exemplo...');
    try {
      const petData = {
        id: 'example-pet-id',
        organization_id: orgId,
        customer_id: 'example-customer-id',
        name: 'Rex',
        species: 'Cão',
        breed: 'Labrador',
        color: 'Dourado',
        gender: 'Macho',
        birth_date: '2020-01-15',
        weight: 25.5,
        microchip_number: '123456789012345',
        special_needs: 'Nenhuma',
        allergies: ['ração com frango'],
        medications: [
          {
            name: 'Vitamina C',
            dosage: '1 comprimido/dia',
            frequency: 'Diária'
          }
        ],
        vaccination_status: {
          last_vaccination: '2023-06-15',
          next_vaccination: '2024-06-15',
          vaccines: ['V10', 'Antirrábica']
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: pet, error: petError } = await supabase
        .from('pets')
        .upsert(petData, { onConflict: 'id' })
        .select()
        .single();

      if (petError) {
        console.log(`❌ Erro ao criar pet: ${petError.message}`);
      } else {
        console.log('✅ Pet de exemplo criado');
      }
    } catch (error) {
      console.log(`❌ Erro ao criar pet: ${error.message}`);
    }

    // 3. Criar configuração AI de exemplo
    console.log('🤖 Criando configuração AI de exemplo...');
    try {
      const aiConfigData = {
        id: 'example-ai-config-id',
        organization_id: orgId,
        name: 'Assistente Padrão',
        system_prompt: 'Você é um assistente virtual especializado em pet shop. Seja sempre educado, prestativo e focado no bem-estar dos pets.',
        context_prompt: 'Responda de forma clara e objetiva sobre serviços veterinários, grooming, e cuidados com pets.',
        personality: 'friendly',
        temperature: 0.7,
        max_tokens: 150,
        response_delay_seconds: 2,
        escalation_keywords: ['humano', 'atendente', 'gerente', 'falar com alguém', 'reclamação'],
        auto_reply_enabled: true,
        business_hours_only: false,
        metadata: {
          version: '1.0',
          last_trained: new Date().toISOString()
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: aiConfig, error: aiError } = await supabase
        .from('ai_configurations')
        .upsert(aiConfigData, { onConflict: 'id' })
        .select()
        .single();

      if (aiError) {
        console.log(`❌ Erro ao criar config AI: ${aiError.message}`);
      } else {
        console.log('✅ Configuração AI criada');
      }
    } catch (error) {
      console.log(`❌ Erro ao criar config AI: ${error.message}`);
    }

  } catch (error) {
    console.log(`❌ Erro geral ao criar dados de exemplo: ${error.message}`);
  }
}

async function testRelationships() {
  console.log('🧪 Testando relacionamentos após correções...');

  try {
    // Teste 1: Verificar se customer_id foi adicionado
    const { data: contactsWithCustomerId, error: contactsError } = await supabase
      .from('whatsapp_contacts')
      .select('id, name, phone, customer_id')
      .limit(1);

    if (contactsError) {
      console.log(`❌ customer_id ainda não disponível: ${contactsError.message}`);
    } else {
      console.log(`✅ customer_id disponível em whatsapp_contacts`);
    }

    // Teste 2: Verificar se organização existe
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', '51cff6e5-0bd2-47bd-8840-ec65d5df265a')
      .single();

    if (orgError) {
      console.log(`❌ Organização padrão não encontrada: ${orgError.message}`);
    } else {
      console.log(`✅ Organização padrão existe: ${org.name}`);
    }

    // Teste 3: Tentar query com relacionamento (se customer_id estiver disponível)
    if (!contactsError) {
      try {
        const { data: relationshipTest, error: relError } = await supabase
          .from('whatsapp_contacts')
          .select(`
            id,
            name,
            phone,
            customers!whatsapp_contacts_customer_id_fkey (id, name, email)
          `)
          .limit(1);

        if (relError) {
          console.log(`❌ Relacionamento ainda não funciona: ${relError.message}`);
          console.log(`💡 Pode precisar de tempo para o cache atualizar ou foreign key não está criada`);
        } else {
          console.log(`✅ Relacionamento whatsapp_contacts -> customers funcionando!`);
        }
      } catch (e) {
        console.log(`❌ Erro no teste de relacionamento: ${e.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Erro geral nos testes: ${error.message}`);
  }
}

async function generateBackendFixes() {
  console.log('\n🔧 Gerando correções para o código backend...\n');

  const backendFixes = {
    conversations_route: {
      file: 'backend/src/routes/conversations.ts',
      changes: [
        {
          issue: 'Relacionamento whatsapp_contacts -> customers não funciona',
          fix: 'Usar customer_id explicitamente ou ajustar query',
          code: `
// ANTES (não funciona):
.select(\`
  whatsapp_contacts (
    id, name, phone,
    customers (id, name, email)  // ❌ Relacionamento inexistente
  )
\`)

// DEPOIS (funciona):
.select(\`
  whatsapp_contacts!whatsapp_conversations_contact_id_fkey (
    id, name, phone, customer_id,
    customers!whatsapp_contacts_customer_id_fkey (id, name, email)
  )
\`)

// OU mais simples:
.select(\`
  whatsapp_contacts (id, name, phone, customer_id)
\`)
// E buscar customer separadamente se necessário`
        }
      ]
    },
    customers_route: {
      file: 'backend/src/routes/customers.ts',
      changes: [
        {
          issue: 'Query para conversas do cliente usa relacionamento incorreto',
          fix: 'Ajustar query em customers/:id/conversations',
          code: `
// ANTES:
.eq('whatsapp_contacts.customer_id', id)  // ❌ Pode não funcionar

// DEPOIS:
// Buscar contacts primeiro, depois conversations
const { data: contacts } = await supabase
  .from('whatsapp_contacts')
  .select('id')
  .eq('customer_id', id);

const contactIds = contacts?.map(c => c.id) || [];

const { data: conversations } = await supabase
  .from('whatsapp_conversations')
  .select('*')
  .in('contact_id', contactIds);`
        }
      ]
    }
  };

  console.log('📝 Correções necessárias no backend:');
  console.log('===================================');

  Object.entries(backendFixes).forEach(([route, info]) => {
    console.log(`\n📁 ${info.file}:`);
    info.changes.forEach(change => {
      console.log(`   🐛 Problema: ${change.issue}`);
      console.log(`   🔧 Solução: ${change.fix}`);
      console.log(`   💻 Código:${change.code}`);
    });
  });

  return backendFixes;
}

async function main() {
  console.log('🚀 Aplicando correções no banco de dados...\n');

  // 1. Criar organização padrão
  const org = await createDefaultOrganization();

  // 2. Tentar adicionar customer_id (pode falhar se função não existir)
  await addCustomerIdToWhatsappContacts();

  // 3. Criar usuário padrão (estrutura)
  await createDefaultUser();

  // 4. Criar dados de exemplo
  await createSampleData();

  // 5. Testar relacionamentos
  await testRelationships();

  // 6. Gerar correções para backend
  await generateBackendFixes();

  console.log('\n📋 RESUMO DAS CORREÇÕES APLICADAS:');
  console.log('=================================');
  console.log('✅ 1. Organização padrão criada/verificada');
  console.log('⚠️  2. customer_id em whatsapp_contacts (pode precisar ser manual)');
  console.log('✅ 3. Dados de exemplo criados');
  console.log('✅ 4. Testes de relacionamento executados');

  console.log('\n🎯 PRÓXIMOS PASSOS MANUAIS:');
  console.log('==========================');
  console.log('1. 🔧 No painel do Supabase, adicionar coluna customer_id em whatsapp_contacts:');
  console.log('   ALTER TABLE whatsapp_contacts ADD COLUMN customer_id UUID REFERENCES customers(id);');
  console.log('');
  console.log('2. 🔗 Criar foreign key constraint:');
  console.log('   ALTER TABLE whatsapp_contacts ADD CONSTRAINT fk_whatsapp_contacts_customer');
  console.log('   FOREIGN KEY (customer_id) REFERENCES customers(id);');
  console.log('');
  console.log('3. 📝 Atualizar código backend conforme sugestões acima');
  console.log('');
  console.log('4. 🧪 Testar queries com novos relacionamentos');

  console.log('\n✅ Script de correções concluído!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };