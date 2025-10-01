-- Script para atualizar email de leuzi@auzap.com.br para leuzzi@auzap.com.br (com 2 z's)
-- Execute este script no SQL Editor do Supabase

-- 1. Atualizar na tabela auth.users
UPDATE auth.users
SET
  email = 'leuzzi@auzap.com.br',
  raw_user_meta_data = jsonb_set(
    jsonb_set(raw_user_meta_data, '{email}', '"leuzzi@auzap.com.br"'),
    '{full_name}',
    '"Leuzzi Auzap"'
  )
WHERE email = 'leuzi@auzap.com.br';

-- 2. Atualizar na tabela public.profiles
UPDATE public.profiles
SET
  email = 'leuzzi@auzap.com.br',
  full_name = 'Leuzzi Auzap'
WHERE email = 'leuzi@auzap.com.br';

-- 3. Verificar se a atualização foi bem-sucedida
SELECT
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  p.role,
  u.email_confirmed_at,
  u.encrypted_password IS NOT NULL as has_password
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'leuzzi@auzap.com.br';
