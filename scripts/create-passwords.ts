import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const petshops = [
  {
    name: 'Cafofo Pet',
    email: 'contato@cafofopet.com.br',
    password: 'CafofoPet@2024#Secure'
  },
  {
    name: 'Nimitinhos Pet Hotel',
    email: 'contato@nimitinhos.com.br',
    password: 'Nimitinhos@2024#Hotel'
  },
  {
    name: 'Pet Exclusivo',
    email: 'contato@petexclusivo.com.br',
    password: 'PetExclusivo@2024#BA'
  }
];

async function updatePassword(email: string, password: string) {
  console.log(`\n🔐 Atualizando senha para: ${email}`);

  // Buscar usuário
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === email);

  if (!user) {
    console.log(`❌ Usuário não encontrado: ${email}`);
    return false;
  }

  // Atualizar senha
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password }
  );

  if (error) {
    console.log(`❌ Erro ao atualizar senha: ${error.message}`);
    return false;
  }

  console.log(`✅ Senha atualizada com sucesso!`);
  return true;
}

async function main() {
  console.log('🎯 ATUALIZANDO SENHAS DOS PETSHOPS');
  console.log('='.repeat(60));

  const results = [];

  for (const petshop of petshops) {
    const success = await updatePassword(petshop.email, petshop.password);
    results.push({
      name: petshop.name,
      email: petshop.email,
      password: petshop.password,
      success
    });
  }

  console.log('\n\n📊 RESUMO FINAL');
  console.log('='.repeat(60));

  results.forEach(r => {
    console.log(`\n${r.success ? '✅' : '❌'} ${r.name}`);
    console.log(`   Email: ${r.email}`);
    console.log(`   Senha: ${r.password}`);
  });

  const allSuccess = results.every(r => r.success);
  console.log('\n' + '='.repeat(60));
  console.log(`${allSuccess ? '✅ TODAS AS SENHAS ATUALIZADAS!' : '⚠️  ALGUNS PROBLEMAS ENCONTRADOS'}`);
  console.log('='.repeat(60) + '\n');

  // Gerar arquivo HTML
  const html = generateHTML(results);
  const fs = await import('fs');
  fs.writeFileSync('credenciais-petshops.html', html);
  console.log('📄 Arquivo HTML gerado: credenciais-petshops.html\n');
}

function generateHTML(credentials: any[]) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Credenciais de Acesso - Auzap.ai</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 800px;
            width: 100%;
            padding: 3rem;
        }

        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 2px solid #f0f0f0;
        }

        .logo {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            color: #666;
            font-size: 1.1rem;
        }

        .credential-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 1.5rem;
            border-left: 5px solid #667eea;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .credential-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .petshop-name {
            font-size: 1.5rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-success {
            background: #d4edda;
            color: #155724;
        }

        .credential-row {
            display: grid;
            grid-template-columns: 120px 1fr auto;
            align-items: center;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: white;
            border-radius: 8px;
        }

        .credential-label {
            font-weight: 600;
            color: #666;
            font-size: 0.9rem;
        }

        .credential-value {
            font-family: 'Courier New', monospace;
            color: #333;
            font-size: 1rem;
            word-break: break-all;
        }

        .copy-btn {
            padding: 0.5rem 1rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .copy-btn:hover {
            background: #764ba2;
            transform: scale(1.05);
        }

        .copy-btn:active {
            transform: scale(0.95);
        }

        .footer {
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 2px solid #f0f0f0;
            color: #666;
        }

        .warning {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 10px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            display: flex;
            gap: 1rem;
            align-items: flex-start;
        }

        .warning-icon {
            font-size: 2rem;
        }

        .warning-text {
            flex: 1;
        }

        .warning-title {
            font-weight: 700;
            color: #856404;
            margin-bottom: 0.5rem;
        }

        .warning-desc {
            color: #856404;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        @media (max-width: 768px) {
            .container {
                padding: 1.5rem;
            }

            .credential-row {
                grid-template-columns: 1fr;
                gap: 0.5rem;
            }

            .copy-btn {
                width: 100%;
            }
        }

        @media print {
            body {
                background: white;
            }

            .copy-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🐾 Auzap.ai</div>
            <div class="subtitle">Credenciais de Acesso dos Petshops</div>
        </div>

        <div class="warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">
                <div class="warning-title">CONFIDENCIAL</div>
                <div class="warning-desc">
                    Este documento contém informações sensíveis. Mantenha em local seguro e não compartilhe com terceiros.
                    Recomendamos alterar as senhas após o primeiro acesso.
                </div>
            </div>
        </div>

        ${credentials.map(cred => `
        <div class="credential-card">
            <div class="petshop-name">
                ${cred.name}
                ${cred.success ? '<span class="status-badge status-success">✓ Ativo</span>' : ''}
            </div>

            <div class="credential-row">
                <div class="credential-label">Email:</div>
                <div class="credential-value">${cred.email}</div>
                <button class="copy-btn" onclick="copyToClipboard('${cred.email}', this)">
                    📋 Copiar
                </button>
            </div>

            <div class="credential-row">
                <div class="credential-label">Senha:</div>
                <div class="credential-value">${cred.password}</div>
                <button class="copy-btn" onclick="copyToClipboard('${cred.password}', this)">
                    📋 Copiar
                </button>
            </div>
        </div>
        `).join('')}

        <div class="footer">
            <p><strong>URL de Acesso:</strong> https://auzap-frontend-web.onrender.com</p>
            <p style="margin-top: 1rem; font-size: 0.9rem;">
                Documento gerado em: ${new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </p>
        </div>
    </div>

    <script>
        async function copyToClipboard(text, button) {
            try {
                await navigator.clipboard.writeText(text);
                const originalText = button.textContent;
                button.textContent = '✓ Copiado!';
                button.style.background = '#28a745';

                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '#667eea';
                }, 2000);
            } catch (err) {
                alert('Erro ao copiar. Por favor, copie manualmente.');
            }
        }

        // Impedir screenshot em alguns navegadores
        document.addEventListener('keyup', (e) => {
            if (e.key === 'PrintScreen') {
                navigator.clipboard.writeText('');
                alert('Screenshots não são recomendados para manter a segurança das credenciais.');
            }
        });
    </script>
</body>
</html>`;
}

main().catch(console.error);
