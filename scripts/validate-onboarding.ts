import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const EVOLUTION_API_URL = 'https://pangea-evolution-api.kmvspi.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const petshops = [
  {
    name: 'Cafofo Pet',
    email: 'contato@cafofopet.com.br',
    organizationSlug: 'cafofo-pet',
    instanceName: 'cafofo_pet'
  },
  {
    name: 'Nimitinhos Pet Hotel',
    email: 'contato@nimitinhos.com.br',
    organizationSlug: 'nimitinhos-pet-hotel',
    instanceName: 'nimitinhos_pet_hotel'
  },
  {
    name: 'Pet Exclusivo',
    email: 'contato@petexclusivo.com.br',
    organizationSlug: 'pet-exclusivo',
    instanceName: 'user_e482be34-c456-42f9-a6fb-31501201aaf7'
  }
];

async function validatePetshop(petshop: typeof petshops[0]) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 VALIDANDO: ${petshop.name}`);
  console.log('='.repeat(60));

  let allValid = true;

  // 1. Validar usuário
  console.log('\n1️⃣ Validando usuário no Auth...');
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === petshop.email);

  if (user && user.email_confirmed_at) {
    console.log(`   ✅ Usuário encontrado e confirmado: ${user.email}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🆔 ID: ${user.id}`);
  } else {
    console.log(`   ❌ Usuário não encontrado ou não confirmado`);
    allValid = false;
  }

  // 2. Validar organização
  console.log('\n2️⃣ Validando organização...');
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', petshop.organizationSlug)
    .single();

  if (org && !orgError) {
    console.log(`   ✅ Organização encontrada: ${org.name}`);
    console.log(`   🏢 Nome: ${org.display_name || org.name}`);
    console.log(`   🆔 ID: ${org.id}`);
    console.log(`   📊 Plano: ${org.subscription_tier}`);
    console.log(`   ✔️  Ativa: ${org.is_active ? 'Sim' : 'Não'}`);
    console.log(`   📍 Cidade: ${org.city || 'N/A'}`);
    console.log(`   🌐 Website: ${org.website || 'N/A'}`);
  } else {
    console.log(`   ❌ Organização não encontrada: ${orgError?.message}`);
    allValid = false;
  }

  // 3. Validar perfil
  console.log('\n3️⃣ Validando perfil do usuário...');
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile && !profileError) {
      console.log(`   ✅ Perfil encontrado: ${profile.full_name}`);
      console.log(`   👤 Nome: ${profile.full_name}`);
      console.log(`   📧 Email: ${profile.email}`);
      console.log(`   📱 Telefone: ${profile.phone || 'N/A'}`);
      console.log(`   🏢 Org ID: ${profile.organization_id}`);
      console.log(`   ✔️  Onboarding: ${profile.onboarding_completed ? 'Completo' : 'Incompleto'}`);
      console.log(`   ✔️  Ativo: ${profile.is_active ? 'Sim' : 'Não'}`);
    } else {
      console.log(`   ❌ Perfil não encontrado: ${profileError?.message}`);
      allValid = false;
    }
  }

  // 4. Validar instância WhatsApp (Supabase)
  console.log('\n4️⃣ Validando instância WhatsApp no Supabase...');
  if (org) {
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', org.id)
      .single();

    if (instance && !instanceError) {
      console.log(`   ✅ Instância WhatsApp encontrada: ${instance.instance_name}`);
      console.log(`   📱 Nome: ${instance.instance_name}`);
      console.log(`   🆔 ID: ${instance.id}`);
      console.log(`   📊 Status: ${instance.status}`);
      console.log(`   🔌 Conexão: ${instance.connection_status}`);
      console.log(`   ✔️  Primária: ${instance.is_primary ? 'Sim' : 'Não'}`);
      console.log(`   🔗 Webhook: ${instance.webhook_url || 'N/A'}`);
    } else {
      console.log(`   ❌ Instância WhatsApp não encontrada: ${instanceError?.message}`);
      allValid = false;
    }
  }

  // 5. Validar instância WhatsApp (Evolution API)
  console.log('\n5️⃣ Validando instância na Evolution API...');
  try {
    const response = await axios.get(
      `${EVOLUTION_API_URL}/instance/fetchInstances`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      }
    );

    const instances = response.data;
    const evolutionInstance = instances.find((inst: any) =>
      inst.name === petshop.instanceName
    );

    if (evolutionInstance) {
      console.log(`   ✅ Instância encontrada na Evolution API: ${evolutionInstance.name}`);
      console.log(`   📱 Nome: ${evolutionInstance.name}`);
      console.log(`   🔌 Status: ${evolutionInstance.connectionStatus}`);
      console.log(`   🔧 Integração: ${evolutionInstance.integration}`);
      console.log(`   📞 Número: ${evolutionInstance.number || 'Não conectado'}`);
      console.log(`   👤 Owner: ${evolutionInstance.ownerJid || 'N/A'}`);
    } else {
      console.log(`   ❌ Instância não encontrada na Evolution API`);
      allValid = false;
    }
  } catch (error: any) {
    console.log(`   ❌ Erro ao validar Evolution API: ${error.message}`);
    allValid = false;
  }

  // 6. Validar configuração de IA
  console.log('\n6️⃣ Validando configuração de IA...');
  if (org) {
    const { data: aiConfig, error: aiError } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('organization_id', org.id)
      .single();

    if (aiConfig && !aiError) {
      console.log(`   ✅ Configuração de IA encontrada: ${aiConfig.name}`);
      console.log(`   🤖 Nome: ${aiConfig.name}`);
      console.log(`   🆔 ID: ${aiConfig.id}`);
      console.log(`   ✔️  Ativa: ${aiConfig.is_active ? 'Sim' : 'Não'}`);
      console.log(`   🔄 Auto Reply: ${aiConfig.auto_reply_enabled ? 'Sim' : 'Não'}`);
      console.log(`   😊 Personalidade: ${aiConfig.personality}`);
      console.log(`   🌡️  Temperatura: ${aiConfig.temperature}`);
      console.log(`   📝 Max Tokens: ${aiConfig.max_tokens}`);

      // Validar contexto
      const hasContext = aiConfig.context_prompt && aiConfig.context_prompt.length > 100;
      const hasSystemPrompt = aiConfig.system_prompt && aiConfig.system_prompt.length > 20;

      console.log(`   📖 Contexto: ${hasContext ? '✅ Configurado' : '❌ Vazio'}`);
      console.log(`   💬 System Prompt: ${hasSystemPrompt ? '✅ Configurado' : '❌ Vazio'}`);

      if (!hasContext || !hasSystemPrompt) {
        allValid = false;
      }
    } else {
      console.log(`   ❌ Configuração de IA não encontrada: ${aiError?.message}`);
      allValid = false;
    }
  }

  console.log(`\n${allValid ? '✅' : '❌'} Status final: ${allValid ? 'TUDO OK!' : 'PROBLEMAS ENCONTRADOS'}`);
  console.log('='.repeat(60));

  return allValid;
}

async function main() {
  console.log('\n🎯 VALIDAÇÃO DO ONBOARDING DOS PETSHOPS');
  console.log('='.repeat(60));

  const results = [];

  for (const petshop of petshops) {
    const isValid = await validatePetshop(petshop);
    results.push({ petshop: petshop.name, valid: isValid });
  }

  console.log('\n\n📊 RESUMO FINAL DA VALIDAÇÃO');
  console.log('='.repeat(60));

  results.forEach(result => {
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${result.petshop}: ${result.valid ? 'OK' : 'PROBLEMAS'}`);
  });

  const allValid = results.every(r => r.valid);
  const percentage = (results.filter(r => r.valid).length / results.length) * 100;

  console.log('\n' + '='.repeat(60));
  console.log(`📈 Taxa de sucesso: ${percentage.toFixed(0)}%`);
  console.log(`${allValid ? '✅ ONBOARDING COMPLETO!' : '⚠️  ONBOARDING COM PROBLEMAS'}`);
  console.log('='.repeat(60) + '\n');

  process.exit(allValid ? 0 : 1);
}

main().catch(console.error);
