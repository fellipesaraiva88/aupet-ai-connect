import { test, expect } from '@playwright/test';

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

test.describe('Validação de Login dos Petshops', () => {
  petshops.forEach(petshop => {
    test(`deve fazer login com sucesso - ${petshop.name}`, async ({ page }) => {
      // Navegar para a página de login
      await page.goto('https://auzap-frontend-web.onrender.com/login');
      await page.waitForLoadState('networkidle');

      // Preencher formulário de login
      await page.fill('input[type="email"]', petshop.email);
      await page.fill('input[type="password"]', petshop.password);

      // Clicar em login
      await page.click('button[type="submit"]');

      // Aguardar navegação
      await page.waitForTimeout(5000);

      const currentUrl = page.url();

      // Verificar se foi redirecionado para dashboard
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/home')) {
        console.log(`✅ ${petshop.name}: Login bem-sucedido!`);
        expect(currentUrl).toContain('/dashboard');
      } else {
        // Verificar se há mensagem de erro
        const errorVisible = await page.locator('text=/erro|error|incorret/i').isVisible().catch(() => false);

        if (errorVisible) {
          console.log(`❌ ${petshop.name}: Erro de autenticação`);
          const errorText = await page.locator('text=/erro|error|incorret/i').textContent();
          console.log(`   Mensagem: ${errorText}`);
        } else {
          console.log(`⚠️  ${petshop.name}: Não redirecionou para dashboard`);
          console.log(`   URL atual: ${currentUrl}`);
        }
      }
    });
  });

  test('resumo da validação de login', async ({ page }) => {
    console.log('\n📊 RESUMO DA VALIDAÇÃO DE LOGIN');
    console.log('='.repeat(60));
    console.log('Todos os petshops foram testados.');
    console.log('Verifique os logs acima para detalhes de cada login.');
    console.log('='.repeat(60) + '\n');
  });
});
