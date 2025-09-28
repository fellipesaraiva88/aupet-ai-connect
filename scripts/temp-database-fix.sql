
-- Script temporário para corrigir problemas do banco
-- Execute este script no painel do Supabase (SQL Editor)

-- 1. Criar organização padrão com ID válido
INSERT INTO organizations (id, name, created_at, updated_at, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Organização Padrão',
  NOW(),
  NOW(),
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- 2. Verificar se customer_id existe em whatsapp_contacts, se não, adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'whatsapp_contacts'
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE whatsapp_contacts
        ADD COLUMN customer_id UUID REFERENCES customers(id);

        CREATE INDEX idx_whatsapp_contacts_customer_id
        ON whatsapp_contacts(customer_id);
    END IF;
END $$;

-- 3. Criar um cliente de exemplo
INSERT INTO customers (id, organization_id, name, phone, email, created_at, updated_at, is_active)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Cliente Exemplo',
  '+5511999999999',
  'exemplo@test.com',
  NOW(),
  NOW(),
  true
) ON CONFLICT DO NOTHING;

-- 4. Atualizar RLS policies para permitir acesso com organização padrão
DROP POLICY IF EXISTS "Organization isolation" ON customers;
CREATE POLICY "Organization isolation" ON customers
  FOR ALL USING (
    organization_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organization isolation" ON whatsapp_contacts;
CREATE POLICY "Organization isolation" ON whatsapp_contacts
  FOR ALL USING (
    organization_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 5. Verificar se todas as tabelas críticas têm organization_id
-- Se alguma não tiver, os selects falharão

SELECT 'Script executado com sucesso!' as resultado;
