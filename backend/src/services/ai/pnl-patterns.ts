/**
 * PNL (Programação Neurolinguística) Patterns
 * Técnicas de persuasão e comunicação humanizada
 */

export interface PNLTechnique {
  name: string;
  description: string;
  patterns: string[];
  examples: string[];
}

/**
 * Técnicas de PNL aplicáveis em conversas de vendas
 */
export const PNL_TECHNIQUES = {
  // RAPPORT - Criar conexão emocional
  rapport: {
    name: 'Rapport',
    description: 'Cria conexão emocional espelhando linguagem e emoções',
    patterns: [
      'Entendo completamente...',
      'Eu sei exatamente como você se sente...',
      'Também já passei por isso...',
      'Compreendo sua preocupação...'
    ],
    examples: [
      'Entendo completamente sua preocupação com o {pet}! É normal ficarmos assim quando nossos pets não estão 100%.',
      'Eu sei exatamente como você se sente! O {pet} é parte da família né? 💕'
    ]
  },

  // ANCORAGEM - Vincular emoções positivas
  ancoragem: {
    name: 'Ancoragem',
    description: 'Vincula serviço/produto a emoções positivas',
    patterns: [
      'Imagina só...',
      'Visualiza...',
      'Lembra aquela sensação de...',
      'Pensa comigo...'
    ],
    examples: [
      'Imagina só o {pet} voltando pra casa cheirosinho, peludinho e feliz! 😍',
      'Visualiza ele correndo e brincando sem dor... É isso que queremos pra ele né?'
    ]
  },

  // ESCASSEZ - Urgência sutil
  escassez: {
    name: 'Escassez',
    description: 'Cria sensação de urgência sem pressão',
    patterns: [
      'Só tenho...',
      'Últimas vagas...',
      'Por hoje ainda consigo...',
      'Tenho uma vaguinha ainda...'
    ],
    examples: [
      'Olha, tenho uma vaguinha ainda hoje às 16h! Quer que eu reserve pro {pet}?',
      'Por hoje ainda consigo encaixar ele... Amanhã já tá lotado!'
    ]
  },

  // PROVA SOCIAL - Outros clientes adoram
  provaSocial: {
    name: 'Prova Social',
    description: 'Usa experiências de outros clientes',
    patterns: [
      'Outros tutores...',
      'A maioria dos clientes...',
      'Os pets adoram...',
      'Todo mundo que faz...'
    ],
    examples: [
      'Outros tutores de {especie} adoraram esse tratamento! Os pets saem super tranquilos.',
      'A maioria dos nossos clientes faz isso mensalmente... Os pets ficam lindos!'
    ]
  },

  // AUTORIDADE - Conhecimento técnico sutil
  autoridade: {
    name: 'Autoridade',
    description: 'Demonstra conhecimento sem ser técnico demais',
    patterns: [
      'Nossa veterinária sempre recomenda...',
      'Especialistas indicam...',
      'Por experiência...',
      'O ideal é...'
    ],
    examples: [
      'Nossa veterinária sempre recomenda fazer isso a cada 3 meses... Previne várias doencinhas!',
      'Por experiência, {especies} precisam desse cuidado especial nessa época do ano.'
    ]
  },

  // RECIPROCIDADE - Dar antes de pedir
  reciprocidade: {
    name: 'Reciprocidade',
    description: 'Oferece valor antes de vender',
    patterns: [
      'Deixa eu te dar uma dica...',
      'Vou te contar um segredo...',
      'Posso te ajudar com isso...',
      'Olha só que legal...'
    ],
    examples: [
      'Deixa eu te dar uma dica: Você pode escovar o {pet} em casa antes de trazer... Fica mais rápido e ele fica mais confortável!',
      'Vou te contar um segredo: Se você trazer ele na segunda ou terça, tem desconto! 😉'
    ]
  },

  // PRESSUPOSIÇÃO - Assume aceitação
  pressuposicao: {
    name: 'Pressuposição',
    description: 'Pressupõe que o cliente vai aceitar',
    patterns: [
      'Quando você trouxer...',
      'Depois que ele fizer...',
      'Na próxima vez...',
      'Assim que...'
    ],
    examples: [
      'Quando você trouxer o {pet}, vamos fazer um check-up completo, ok?',
      'Depois que ele fizer o banho, já aproveita e faz as unhinhas! Fica perfeito.'
    ]
  },

  // PERGUNTAS DIRIGIDAS - Leva à conclusão desejada
  perguntasDirigidas: {
    name: 'Perguntas Dirigidas',
    description: 'Faz perguntas que levam ao sim',
    patterns: [
      'Não é mesmo?',
      'Você acha que...?',
      'Seria bom se...?',
      'Não concorda?'
    ],
    examples: [
      'Seria bom cuidar disso logo, não é mesmo? Antes que piore...',
      'Você acha que o {pet} está precisando de um carinho especial, né?'
    ]
  }
};

/**
 * Gatilhos mentais específicos para pet shops
 */
export const MENTAL_TRIGGERS = {
  amor_pet: {
    trigger: 'amor',
    phrases: [
      'Ele merece todo carinho do mundo!',
      'Nosso amor de 4 patas!',
      'Coisa mais linda!',
      'Bebê perfeito!'
    ]
  },

  culpa_produtiva: {
    trigger: 'culpa',
    phrases: [
      'Faz tempo que ele não...',
      'Ele tá precisando de...',
      'Que tal darmos uma atenção especial pra ele?'
    ]
  },

  medo_perda: {
    trigger: 'medo',
    phrases: [
      'Prevenir é sempre melhor...',
      'Antes que vire algo sério...',
      'Não queremos que ele sofra, né?'
    ]
  },

  pertencimento: {
    trigger: 'grupo',
    phrases: [
      'Aqui somos todos apaixonados por pets!',
      'Nossa comunidade de tutores...',
      'Faz parte da família Auzap!'
    ]
  }
};

/**
 * Padrões de linguagem humanizada (Milton Model)
 */
export const MILTON_PATTERNS = [
  'Você pode começar a notar...',
  'É interessante como...',
  'Talvez você já tenha percebido...',
  'Algumas pessoas descobrem que...',
  'À medida que você pensa sobre...'
];

/**
 * Aplica técnica de PNL em uma mensagem
 */
export function applyPNLTechnique(
  message: string,
  technique: keyof typeof PNL_TECHNIQUES,
  variables: Record<string, string> = {}
): string {
  const tech = PNL_TECHNIQUES[technique];

  // Seleciona um pattern aleatório da técnica
  const pattern = tech.patterns[Math.floor(Math.random() * tech.patterns.length)];

  // Substitui variáveis
  let result = pattern;
  Object.keys(variables).forEach(key => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
  });

  return result;
}

/**
 * Seleciona técnica de PNL baseada na intenção
 */
export function selectPNLTechniqueByIntent(intent: string): keyof typeof PNL_TECHNIQUES {
  const intentTechniqueMap: Record<string, keyof typeof PNL_TECHNIQUES> = {
    'agendar': 'escassez',
    'duvida': 'autoridade',
    'orcamento': 'provaSocial',
    'informacao': 'reciprocidade',
    'emergencia': 'rapport',
    'reclamacao': 'rapport',
    'elogio': 'ancoragem'
  };

  return intentTechniqueMap[intent] || 'rapport';
}