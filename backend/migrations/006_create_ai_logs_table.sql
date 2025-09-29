-- Tabela de logs estruturados de IA
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES profiles(organization_id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Tipo de evento
  event_type TEXT NOT NULL CHECK (event_type IN (
    'message_analyzed',
    'opportunity_detected',
    'response_generated',
    'escalated',
    'error'
  )),

  -- Análise de mensagem
  intent TEXT,
  confidence DECIMAL(3, 2),
  sentiment TEXT,
  urgency TEXT,

  -- Oportunidade de venda
  opportunity_type TEXT,
  opportunity_service TEXT,
  opportunity_confidence DECIMAL(3, 2),
  pnl_technique TEXT,

  -- Resposta gerada
  response_text TEXT,
  response_fragments INTEGER,
  humanization_applied BOOLEAN DEFAULT false,
  time_of_day TEXT,
  customer_tone TEXT,

  -- Resultados
  was_escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  customer_replied BOOLEAN DEFAULT false,
  conversion_achieved BOOLEAN DEFAULT false,

  -- Performance
  processing_time_ms INTEGER,
  error_message TEXT,

  -- Metadados adicionais
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ai_logs_organization ON ai_logs(organization_id);
CREATE INDEX idx_ai_logs_conversation ON ai_logs(conversation_id);
CREATE INDEX idx_ai_logs_event_type ON ai_logs(event_type);
CREATE INDEX idx_ai_logs_created_at ON ai_logs(created_at);
CREATE INDEX idx_ai_logs_pnl_technique ON ai_logs(pnl_technique) WHERE pnl_technique IS NOT NULL;

-- RLS Policies
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- Usuários só veem logs da própria organização
CREATE POLICY ai_logs_select_policy ON ai_logs
  FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Sistema pode inserir logs
CREATE POLICY ai_logs_insert_policy ON ai_logs
  FOR INSERT
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE ai_logs IS 'Logs estruturados de todas as ações da IA para análise e treinamento';
COMMENT ON COLUMN ai_logs.event_type IS 'Tipo de evento: message_analyzed, opportunity_detected, response_generated, escalated, error';
COMMENT ON COLUMN ai_logs.pnl_technique IS 'Técnica de PNL aplicada: rapport, ancoragem, escassez, prova_social, etc';
COMMENT ON COLUMN ai_logs.metadata IS 'Dados adicionais em formato JSON para análises futuras';