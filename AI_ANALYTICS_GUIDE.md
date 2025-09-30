# 📊 GUIA DO DASHBOARD IA ANALYTICS

## 🎯 Visão Geral

O Dashboard IA Analytics fornece insights detalhados sobre o comportamento e performance da inteligência artificial do Auzap. Ele monitora em tempo real todas as interações da IA com os clientes, técnicas de PNL aplicadas, oportunidades detectadas e escalações para humanos.

---

## 🔗 Como Acessar

**URL**: https://auzap.com.br/ai-analytics

**Requisitos**:
- Usuário autenticado no sistema
- Permissão de acesso (todos os usuários logados têm acesso)

---

## 📈 Seções do Dashboard

### 1. **KPIs Principais** (Cards no topo)

#### 📩 Total de Mensagens Analisadas
- **O que é**: Quantidade total de mensagens processadas pela IA
- **Indica**: Volume de atendimento automatizado
- **Meta**: > 100 mensagens/dia para operação ativa

#### 🎯 Oportunidades Detectadas
- **O que é**: Número de oportunidades de venda identificadas pela IA
- **Indica**: Eficácia da IA em detectar intenção de compra
- **Meta**: > 30% das mensagens analisadas
- **Cálculo**: (oportunidades / mensagens) × 100

#### 💯 Confiança Média
- **O que é**: Score médio de confiança da IA nas análises
- **Indica**: Certeza da IA nas decisões tomadas
- **Meta**: > 0.70 (70%)
- **Escala**: 0.0 a 1.0
- **Interpretação**:
  - 0.0 - 0.5: Baixa confiança (revisar prompts)
  - 0.5 - 0.7: Confiança moderada
  - 0.7 - 0.9: Boa confiança
  - 0.9 - 1.0: Excelente confiança

#### ⚡ Tempo Médio de Processamento
- **O que é**: Tempo médio para IA analisar e responder
- **Indica**: Performance do sistema
- **Meta**: < 2000ms (2 segundos)
- **Ação se alto**: Otimizar prompts ou aumentar recursos

---

### 2. **Performance das Técnicas de PNL**

Gráfico de barras mostrando quantas vezes cada técnica de PNL foi utilizada.

#### 🧠 Técnicas Disponíveis:

1. **Rapport**
   - Criar conexão emocional com o cliente
   - Exemplo: "Entendo perfeitamente sua preocupação..."
   - Uso ideal: Toda conversa inicial

2. **Ancoragem**
   - Fixar ideias positivas na mente do cliente
   - Exemplo: "Imagina só seu pet saudável e feliz..."
   - Uso ideal: Apresentar serviços

3. **Escassez**
   - Criar senso de urgência
   - Exemplo: "Temos apenas 2 vagas disponíveis hoje"
   - Uso ideal: Promoções e agenda limitada

4. **Prova Social**
   - Validação através de experiência de outros
   - Exemplo: "Mais de 500 pets já foram atendidos..."
   - Uso ideal: Convencer indecisos

5. **Autoridade**
   - Demonstrar expertise
   - Exemplo: "Nossa equipe tem 15 anos de experiência"
   - Uso ideal: Casos complexos

6. **Reciprocidade**
   - Oferecer algo primeiro
   - Exemplo: "Vou te enviar um guia gratuito sobre..."
   - Uso ideal: Engajamento inicial

7. **Pressuposição**
   - Assumir que a ação vai acontecer
   - Exemplo: "Qual horário funciona melhor para você?"
   - Uso ideal: Fechar agendamentos

8. **Perguntas Dirigidas**
   - Guiar o cliente para resposta desejada
   - Exemplo: "Você prefere consulta terça ou quinta?"
   - Uso ideal: Direcionar decisão

**Interpretação**:
- **Balanceado**: Boa variedade de técnicas (sinal de humanização)
- **Desequilibrado**: Dominância de 1-2 técnicas (revisar prompts)

---

### 3. **Distribuição de Urgência**

Mostra como as mensagens são classificadas por nível de urgência.

#### 🔴 Alta Urgência
- Casos de emergência (envenenamento, acidente, etc.)
- **Ação**: Escalação imediata para humano
- **Meta**: < 10% do total

#### 🟡 Média Urgência
- Sintomas preocupantes mas não críticos
- **Ação**: Prioridade no atendimento
- **Meta**: 20-30% do total

#### 🟢 Baixa Urgência
- Dúvidas gerais, agendamentos rotineiros
- **Ação**: IA pode responder tranquilamente
- **Meta**: 60-70% do total

**Análise**:
- Muita urgência alta? Cliente base pode estar em risco
- Muita urgência baixa? Boa oportunidade para automação

---

### 4. **Taxa de Escalação**

Percentual de conversas que a IA decidiu escalar para atendimento humano.

**Fórmula**: (escalações / mensagens) × 100

#### 📊 Benchmarks:
- **Ideal**: 10-20%
- **Aceitável**: 20-30%
- **Atenção**: > 30% (IA escalando demais)
- **Ótimo**: < 10% (IA muito confiante - cuidado!)

#### 🤔 Se taxa muito alta (>30%):
1. IA não está confiante o suficiente
2. Prompts podem estar muito conservadores
3. Base de conhecimento incompleta
4. Casos realmente complexos (OK se intencional)

#### 🤔 Se taxa muito baixa (<10%):
1. IA pode estar respondendo casos que deveria escalar
2. Verificar qualidade das respostas
3. Clientes podem estar insatisfeitos silenciosamente

---

### 5. **Insights e Recomendações**

Alertas automáticos gerados com base nas métricas:

#### ⚠️ Tipos de Alerta:

**Performance**:
- 🔴 "Tempo de resposta acima de 3s" → Otimizar
- 🟡 "Confiança média abaixo de 60%" → Revisar prompts

**Volume**:
- 🔵 "Taxa de escalação acima de 25%" → IA escalando muito
- 🟢 "Taxa de detecção de oportunidades baixa" → Melhorar detecção

**Qualidade**:
- 🟣 "Técnicas de PNL desbalanceadas" → Variar abordagem
- 🟡 "Muitas mensagens de urgência alta" → Investigar

---

## 🔍 Filtros Disponíveis

### Por Período:
- **Últimas 24 horas**: Visualização em tempo real
- **Últimos 7 dias**: Tendências semanais
- **Últimos 30 dias**: Análise mensal
- **Período customizado**: Escolher datas específicas

### Por Organização:
- Filtro automático baseado na organização do usuário logado
- Super admins podem ver todas as organizações

---

## 📊 Como Interpretar os Dados

### Cenário 1: Sistema Saudável ✅
```
Mensagens: 500
Oportunidades: 180 (36%)
Confiança: 0.78
Tempo: 1800ms
Escalação: 15%
```
**Análise**: IA está performando bem. Continue monitorando.

### Cenário 2: IA Escalando Muito ⚠️
```
Mensagens: 300
Oportunidades: 90 (30%)
Confiança: 0.55
Tempo: 2200ms
Escalação: 35%
```
**Análise**: IA insegura. Revisar prompts e adicionar mais contexto.

### Cenário 3: Baixa Detecção de Oportunidades ⚠️
```
Mensagens: 400
Oportunidades: 40 (10%)
Confiança: 0.82
Tempo: 1500ms
Escalação: 12%
```
**Análise**: IA respondendo bem mas perdendo vendas. Melhorar detecção.

### Cenário 4: Lento Demais 🐌
```
Mensagens: 250
Oportunidades: 75 (30%)
Confiança: 0.80
Tempo: 4500ms
Escalação: 18%
```
**Análise**: Performance crítica. Otimizar prompts ou escalar recursos.

---

## 🛠️ Troubleshooting

### Dashboard Não Carrega
1. Verificar se está autenticado
2. Limpar cache do browser (Ctrl + Shift + R)
3. Verificar console do browser para erros
4. Confirmar que `/ai-analytics` rota existe

### Dados Vazios
1. **Normal se**: Sistema novo sem mensagens processadas
2. **Verificar**:
   - Webhook WhatsApp está configurado?
   - Backend está recebendo mensagens?
   - Tabela `ai_logs` existe no Supabase?

### Métricas Incorretas
1. Verificar filtro de período selecionado
2. Confirmar organização correta
3. Checar logs no backend (`/api/ai-metrics/logs`)

### Erros de Carregamento
1. Verificar API está online: `https://auzap-backend.onrender.com/health`
2. Checar se token de autenticação é válido
3. Ver console do browser para detalhes

---

## 🔗 APIs Relacionadas

### GET `/api/ai-metrics/metrics`
```bash
curl https://auzap-backend.onrender.com/api/ai-metrics/metrics \
  -H "Authorization: Bearer {token}" \
  -G \
  -d "startDate=2025-01-01" \
  -d "endDate=2025-01-31"
```

**Response**:
```json
{
  "success": true,
  "metrics": {
    "totalMessages": 500,
    "opportunitiesDetected": 180,
    "averageConfidence": 0.78,
    "averageProcessingTime": 1800,
    "escalationRate": 15.2,
    "pnlTechniques": {
      "rapport": 120,
      "ancoragem": 95,
      "escassez": 80
    },
    "urgencyDistribution": {
      "high": 50,
      "medium": 150,
      "low": 300
    }
  }
}
```

### GET `/api/ai-metrics/logs`
Lista logs individuais com filtros avançados.

### GET `/api/ai-metrics/conversation/:id`
Histórico completo de uma conversa específica.

### GET `/api/ai-metrics/pnl-performance`
Performance detalhada de cada técnica de PNL.

---

## 📚 Documentação Adicional

- **DEPLOY_CHECKLIST.md**: Status completo do sistema
- **Backend Logs**: Via Render Dashboard
- **Supabase**: Acesso direto à tabela `ai_logs`

---

## 🎯 Próximos Passos

1. **Monitoramento Contínuo**: Acessar dashboard diariamente
2. **Otimização**: Ajustar prompts baseado nas métricas
3. **A/B Testing**: Testar diferentes abordagens de PNL
4. **Exportação**: Implementar relatórios PDF (futuro)
5. **Alertas**: Configurar notificações automáticas (futuro)

---

**Última Atualização**: 30/09/2025
**Versão**: 1.0
**Contato**: Equipe Auzap