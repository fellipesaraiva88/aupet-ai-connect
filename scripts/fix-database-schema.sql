
-- 1. Criar organização padrão
INSERT INTO organizations (id, name, created_at, updated_at)
VALUES (
  '51cff6e5-0bd2-47bd-8840-ec65d5df265a',
  'Organização Padrão',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Adicionar coluna customer_id em whatsapp_contacts
ALTER TABLE whatsapp_contacts
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_customer_id
ON whatsapp_contacts(customer_id);

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
  ));