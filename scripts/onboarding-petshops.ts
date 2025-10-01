import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const EVOLUTION_API_URL = 'https://pangea-evolution-api.kmvspi.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface PetshopData {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  services: string[];
  business_hours: string;
  website?: string;
  instagram?: string;
  ai_config: {
    context: string;
    greeting_message: string;
    away_message: string;
    auto_reply_enabled: boolean;
  };
}

const petshops: PetshopData[] = [
  {
    name: 'Cafofo Pet',
    email: 'contato@cafofopet.com.br',
    phone: '5521999999001',
    city: 'Rio de Janeiro',
    state: 'RJ',
    services: ['Creche para Cães', 'Hotel para Cães', 'Monitoramento 24h'],
    business_hours: 'Segunda à Sábado: 07:30h às 20h',
    website: 'https://cafofopet.com.br',
    instagram: '@cafofopet',
    ai_config: {
      context: `Você é o assistente virtual do Cafofo Pet, uma creche e hotel para cães no Méier, Rio de Janeiro.

SOBRE O CAFOFO PET:
- Espaço acolhedor e familiar para creche e hotel canino
- Localização: Méier, Rio de Janeiro
- Horário: Segunda a Sábado, 07:30h às 20h

SERVIÇOS:
- Creche para Cães: ambiente seguro com socialização, brincadeiras, alimentação programada
- Hotel para Cães: hospedagem em clima de casa com supervisão 24h
- Equipe qualificada e apaixonada por pets
- Monitoramento e segurança total

REQUISITOS:
- Vacinas obrigatórias: V8/V10, raiva, giárdia e gripe canina em dia
- Pet deve ser sociável para melhor convivência

DIFERENCIAIS:
- Ambiente 100% familiar com muito carinho
- Rotina rica em atividades
- Socialização segura
- Redução de ansiedade e estresse do pet

Seja sempre cordial, prestativo e demonstre cuidado com os pets. Forneça informações claras sobre serviços, requisitos e horários.`,
      greeting_message: 'Olá! 🐾 Bem-vindo ao Cafofo Pet! Sou o assistente virtual e estou aqui para ajudar. Como posso cuidar do seu pet hoje?',
      away_message: 'Obrigado pelo contato! No momento estamos fora do horário de atendimento (Segunda a Sábado, 07:30h-20h). Em breve retornaremos! 🐕',
      auto_reply_enabled: true
    }
  },
  {
    name: 'Nimitinhos Pet Hotel',
    email: 'contato@nimitinhos.com.br',
    phone: '5531999999002',
    city: 'Ponte Nova',
    state: 'MG',
    services: ['Creche Canina', 'Hotel para Cães Pequenos', 'Socialização'],
    business_hours: 'Consultar via Instagram',
    instagram: '@nimitinhos',
    ai_config: {
      context: `Você é o assistente virtual da Nimitinhos Pet Hotel, especializada em cães de pequeno porte em Ponte Nova, MG.

SOBRE A NIMITINHOS:
- Especializada em cães de pequeno porte (até 10kg)
- Localização: Bairro Fátima, Ponte Nova/MG
- Fundada em dezembro de 2021
- Ambiente doméstico e acolhedor

SERVIÇOS:
- Creche Canina: estímulo, brincadeiras, socialização e atividades recreativas
- Hotel para Cães: hospedagem segura em ambiente doméstico
- Acompanhamento profissional com relatórios de comportamento
- Foco em socialização sadia

DIFERENCIAIS:
- Exclusivo para cães pequenos (até 10kg)
- Ambiente adaptado para pequeno porte
- Rotina monitorada por profissionais
- Considerada extensão do lar

FOCO E MISSÃO:
- Espaço de acolhimento com estímulos positivos
- Afeto e cuidado individualizado
- Redução de ansiedade e solidão
- Bem-estar total do pet

Seja carinhoso, atencioso e destaque o cuidado especial com cães pequenos. Incentive visita ao Instagram para mais informações.`,
      greeting_message: 'Olá! 🐕 Bem-vindo à Nimitinhos Pet Hotel! Especializados em cães pequenos com muito amor. Como posso ajudar você e seu amiguinho?',
      away_message: 'Obrigado pela mensagem! 🐾 No momento não estamos disponíveis, mas em breve retornamos. Acompanhe novidades no @nimitinhos!',
      auto_reply_enabled: true
    }
  },
  {
    name: 'Pet Exclusivo',
    email: 'contato@petexclusivo.com.br',
    phone: '5571999999003',
    city: 'Corte Segura',
    state: 'BA',
    services: ['Hospedagem', 'Creche', 'Adestramento', 'Venda de Produtos'],
    business_hours: 'Consultar via WhatsApp',
    ai_config: {
      context: `Você é o assistente virtual do Pet Exclusivo, hotel e escola de adestramento em Corte Segura, Bahia.

SOBRE O PET EXCLUSIVO:
- Hotel para cães e escola de adestramento
- 10 anos no mercado (desde 2015)
- Localização: Corte Segura, Bahia
- Atende entre 30 a 40 clientes

SERVIÇOS:
- Hospedagem Familiar: ambiente acolhedor e seguro
- Creche: atividades diárias e socialização
- Educação Canina: adestramento profissional
- Aulas Sociorecreativas: socialização com outros cães
- Venda de brinquedos naturais

DIFERENCIAIS:
- 10 anos de experiência
- Adestramento profissional
- Hospedagem em ambiente familiar
- Produtos naturais para pets
- Equipe dedicada

OBJETIVO:
- Otimizar atendimento
- Resposta rápida aos clientes
- Organização e menos estresse
- Aumento de vendas

O Pet Exclusivo busca oferecer respostas rápidas e eficientes, especialmente fora do horário comercial. Seja sempre prestativo e destaque a experiência de 10 anos no mercado.`,
      greeting_message: 'Olá! 🐾 Bem-vindo ao Pet Exclusivo! Com 10 anos cuidando do seu melhor amigo. Hospedagem, adestramento e muito mais! Como posso ajudar?',
      away_message: 'Obrigado pelo contato! 🦴 No momento não estamos disponíveis, mas responderemos em breve. Estamos aqui para cuidar do seu pet!',
      auto_reply_enabled: true
    }
  }
];

async function getOrCreateOrganization(userId: string, petshopData: PetshopData) {
  const slug = petshopData.name.toLowerCase().replace(/\s+/g, '-');

  // Tentar buscar por slug primeiro
  const { data: orgBySlug } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (orgBySlug) {
    console.log(`✅ Organização já existe (slug): ${orgBySlug.name}`);
    return orgBySlug;
  }

  // Tentar buscar por created_by
  const { data: orgByUser } = await supabase
    .from('organizations')
    .select('*')
    .eq('created_by', userId)
    .single();

  if (orgByUser) {
    console.log(`✅ Organização já existe (user): ${orgByUser.name}`);
    return orgByUser;
  }

  const { data, error} = await supabase
    .from('organizations')
    .insert({
      name: petshopData.name,
      display_name: petshopData.name,
      slug,
      created_by: userId,
      email: petshopData.email,
      phone: petshopData.phone,
      city: petshopData.city,
      state: petshopData.state,
      website: petshopData.website,
      business_type: 'petshop',
      subscription_tier: 'premium',
      is_active: true,
      status: 'active',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      language: 'pt-BR',
      country: 'BR'
    })
    .select()
    .single();

  if (error) {
    console.error(`Erro ao criar organização:`, error);
    return null;
  }

  console.log(`✅ Organização criada: ${petshopData.name}`);
  return data;
}

async function createOrUpdateProfile(userId: string, petshopData: PetshopData, organizationId: string) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: petshopData.name,
        phone: petshopData.phone,
        whatsapp_number: petshopData.phone,
        role: 'admin',
        organization_id: organizationId,
        onboarding_completed: true,
        is_active: true,
        metadata: {
          city: petshopData.city,
          state: petshopData.state,
          services: petshopData.services,
          business_hours: petshopData.business_hours,
          website: petshopData.website,
          instagram: petshopData.instagram
        }
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar perfil:`, error);
      return null;
    }

    console.log(`✅ Perfil atualizado: ${petshopData.name}`);
    return data;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: petshopData.email,
      full_name: petshopData.name,
      phone: petshopData.phone,
      whatsapp_number: petshopData.phone,
      role: 'admin',
      organization_id: organizationId,
      onboarding_completed: true,
      is_active: true,
      metadata: {
        city: petshopData.city,
        state: petshopData.state,
        services: petshopData.services,
        business_hours: petshopData.business_hours,
        website: petshopData.website,
        instagram: petshopData.instagram
      }
    })
    .select()
    .single();

  if (error) {
    console.error(`Erro ao criar perfil:`, error);
    return null;
  }

  console.log(`✅ Perfil criado: ${petshopData.name}`);
  return data;
}

async function createWhatsAppInstance(organizationId: string, userId: string, petshopName: string) {
  try {
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (existingInstance) {
      console.log(`✅ Instância WhatsApp já existe: ${existingInstance.instance_name}`);
      return existingInstance;
    }

    const instanceName = petshopName.toLowerCase().replace(/\s+/g, '_');

    const response = await axios.post(
      `${EVOLUTION_API_URL}/instance/create`,
      {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      },
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Instância WhatsApp criada na Evolution API: ${instanceName}`);

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        instance_name: instanceName,
        status: 'disconnected',
        connection_status: 'disconnected',
        is_connected: false,
        is_primary: true,
        webhook_url: `https://auzap-backend.onrender.com/webhook/${instanceName}`
      })
      .select()
      .single();

    if (error) {
      console.error(`Erro ao salvar instância no Supabase:`, error);
      return null;
    }

    console.log(`✅ Instância salva no Supabase`);
    return data;
  } catch (error: any) {
    console.error(`Erro ao criar instância WhatsApp:`, error.response?.data || error.message);
    return null;
  }
}

async function configureAI(organizationId: string, petshopName: string, aiConfig: PetshopData['ai_config']) {
  const { data: existingConfig } = await supabase
    .from('ai_configurations')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (existingConfig) {
    const { data, error } = await supabase
      .from('ai_configurations')
      .update({
        name: `${petshopName} AI`,
        system_prompt: aiConfig.greeting_message,
        context_prompt: aiConfig.context,
        auto_reply_enabled: aiConfig.auto_reply_enabled,
        is_active: true,
        temperature: 0.7,
        max_tokens: 500,
        personality: 'friendly',
        metadata: {
          away_message: aiConfig.away_message
        }
      })
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar IA:`, error);
      return null;
    }

    console.log(`✅ IA atualizada para ${petshopName}`);
    return data;
  }

  const { data, error } = await supabase
    .from('ai_configurations')
    .insert({
      organization_id: organizationId,
      name: `${petshopName} AI`,
      system_prompt: aiConfig.greeting_message,
      context_prompt: aiConfig.context,
      auto_reply_enabled: aiConfig.auto_reply_enabled,
      is_active: true,
      temperature: 0.7,
      max_tokens: 500,
      personality: 'friendly',
      metadata: {
        away_message: aiConfig.away_message
      }
    })
    .select()
    .single();

  if (error) {
    console.error(`Erro ao configurar IA:`, error);
    return null;
  }

  console.log(`✅ IA configurada para ${petshopName}`);
  return data;
}

async function onboardPetshop(petshopData: PetshopData) {
  console.log(`\n🚀 Iniciando onboarding: ${petshopData.name}`);
  console.log('='.repeat(50));

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === petshopData.email);

  if (!user) {
    console.log(`❌ Usuário não encontrado: ${petshopData.email}`);
    return null;
  }

  console.log(`✅ Usuário encontrado: ${petshopData.email}`);

  const organization = await getOrCreateOrganization(user.id, petshopData);
  if (!organization) return null;

  const profile = await createOrUpdateProfile(user.id, petshopData, organization.id);
  if (!profile) return null;

  const whatsappInstance = await createWhatsAppInstance(organization.id, user.id, petshopData.name);
  if (!whatsappInstance) return null;

  const aiConfig = await configureAI(organization.id, petshopData.name, petshopData.ai_config);
  if (!aiConfig) return null;

  console.log('\n✅ ONBOARDING COMPLETO!');
  console.log('='.repeat(50));
  console.log(`Nome: ${petshopData.name}`);
  console.log(`Email: ${petshopData.email}`);
  console.log(`Organização ID: ${organization.id}`);
  console.log(`Instância WhatsApp: ${whatsappInstance.instance_name}`);
  console.log(`IA configurada: ${aiConfig.name}`);
  console.log('='.repeat(50));

  return {
    user,
    organization,
    profile,
    whatsappInstance,
    aiConfig
  };
}

async function main() {
  console.log('🎯 INICIANDO PROCESSO DE ONBOARDING');
  console.log('Total de petshops: ', petshops.length);
  console.log('='.repeat(50));

  const results = [];

  for (const petshop of petshops) {
    const result = await onboardPetshop(petshop);
    if (result) {
      results.push(result);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n📊 RESUMO FINAL');
  console.log('='.repeat(50));
  console.log(`Total processado: ${results.length}/${petshops.length}`);
  console.log('\nPetshops configurados:');
  results.forEach(r => {
    console.log(`\n${r.profile.full_name}:`);
    console.log(`  Email: ${r.user.email}`);
    console.log(`  Organização: ${r.organization.name}`);
    console.log(`  WhatsApp: ${r.whatsappInstance.instance_name}`);
    console.log(`  IA: ${r.aiConfig.name}`);
  });
  console.log('='.repeat(50));
}

main().catch(console.error);
