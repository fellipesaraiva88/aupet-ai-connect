# 🐾 Tutorial Auzap.ai

Tutorial HTML interativo completo para a plataforma Auzap.ai - Inteligência Artificial para Pet Care.

## 📚 Estrutura

```
tutorial/
├── index.html              # Landing page principal
├── assets/
│   ├── css/
│   │   └── styles.css     # Estilos globais
│   ├── js/
│   │   └── tutorial.js    # JavaScript interativo
│   └── images/            # Imagens e screenshots
├── introducao/
│   ├── o-que-e-auzap.html
│   ├── primeiros-passos.html
│   └── navegacao-basica.html
├── whatsapp/
│   ├── conexao-whatsapp.html
│   ├── gerenciar-instancias.html
│   └── configuracoes.html
├── conversas/
│   ├── interface-chat.html
│   ├── enviar-mensagens.html
│   └── historico.html
├── clientes-pets/
│   ├── cadastro-clientes.html
│   ├── cadastro-pets.html
│   └── familias.html
├── agendamentos/
│   ├── criar-agendamento.html
│   ├── calendario.html
│   └── gerenciar.html
├── catalogo/
│   ├── adicionar-servicos.html
│   └── gerenciar-catalogo.html
├── analytics/
│   ├── dashboard.html
│   ├── metricas.html
│   └── relatorios.html
└── ia-config/
    ├── configurar-ia.html
    ├── personalidade.html
    ├── horarios.html
    └── testar-ia.html
```

## ✨ Funcionalidades

### Design System
- ✅ Paleta de cores moderna (Primary: #007AFF, Secondary: #FF69B4)
- ✅ Gradientes suaves e animações fluidas
- ✅ Sombras e profundidade estilo Apple
- ✅ Totalmente responsivo (mobile-first)
- ✅ Modo claro/escuro (opcional)

### Interatividade JavaScript
- ✅ **Progresso do Tutorial** - Salva automaticamente no localStorage
- ✅ **Busca Global** - Encontra qualquer página rapidamente
- ✅ **Copy to Clipboard** - Copiar códigos com um clique
- ✅ **Accordions** - Conteúdo expandível
- ✅ **Tabs** - Alternar entre cenários
- ✅ **Checklists** - Marcar tarefas concluídas
- ✅ **Tooltips** - Informações extras ao passar o mouse
- ✅ **Smooth Scroll** - Navegação suave
- ✅ **Animações de Entrada** - Fade-in ao scroll

### Navegação
- ✅ Sidebar fixo com todas as seções
- ✅ Breadcrumbs para localização
- ✅ Barra de progresso por seção
- ✅ Links "Anterior/Próximo" em cada página
- ✅ Botão "Marcar como Completo"

### Componentes Reutilizáveis
- ✅ Cards com hover effects
- ✅ Alert boxes (info, success, warning, error)
- ✅ Code snippets com syntax highlight
- ✅ Demo containers para screenshots/vídeos
- ✅ Steps indicators (progressão visual)
- ✅ Progress bars

## 🚀 Como Usar

### Desenvolvimento Local

1. **Abrir o tutorial:**
```bash
cd tutorial
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

2. **Servidor local (opcional):**
```bash
# Python 3
python3 -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000

# Então acesse: http://localhost:8000
```

### Deploy

#### Opção 1: Render (Static Site)
```yaml
# render.yaml
services:
  - type: web
    name: auzap-tutorial
    env: static
    buildCommand: echo "No build needed"
    staticPublishPath: ./tutorial
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

#### Opção 2: Netlify
```bash
# Arraste a pasta tutorial/ para Netlify Drop
# Ou use Netlify CLI:
netlify deploy --dir=tutorial --prod
```

#### Opção 3: Vercel
```bash
vercel --prod tutorial/
```

#### Opção 4: GitHub Pages
```bash
# Commit e push para GitHub
git add tutorial/
git commit -m "Add tutorial"
git push

# Nas configurações do repo:
# Settings → Pages → Source: main branch /tutorial folder
```

## 🎨 Personalização

### Cores

Edite `assets/css/styles.css`:

```css
:root {
  --primary: #007AFF;      /* Cor principal */
  --secondary: #FF69B4;    /* Cor secundária */
  --success: #34C759;      /* Sucesso */
  --warning: #FF9500;      /* Aviso */
  --error: #FF3B30;        /* Erro */
}
```

### Adicionar Nova Página

1. Crie o arquivo HTML na pasta apropriada
2. Use a estrutura de uma página existente como template
3. Atualize o sidebar em todas as páginas (ou use includes)
4. Adicione o `data-page-id` único

Exemplo:
```html
<body data-page-id="nova-pagina-1">
  <!-- Conteúdo -->
</body>
```

### Adicionar Screenshots/Vídeos

Coloque em `assets/images/` e use:

```html
<div class="demo-container">
  <img src="../assets/images/screenshot.png" alt="Descrição">
  <p class="demo-caption">Legenda da imagem</p>
</div>
```

### Highlight de Código

Adicione Highlight.js no `<head>`:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>hljs.highlightAll();</script>
```

## 📊 Analytics (Opcional)

Adicione Google Analytics:

```html
<!-- No <head> de todas as páginas -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔧 Manutenção

### Atualizar Progresso

O progresso é salvo automaticamente no `localStorage` do navegador.
Para limpar: `localStorage.clear()` no console.

### Adicionar Atalhos de Teclado

Edite `assets/js/tutorial.js`:

```javascript
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    document.getElementById('search-input').focus();
  }
});
```

## 📝 TODO

Páginas ainda não criadas (use as existentes como template):

- [ ] `whatsapp/gerenciar-instancias.html`
- [ ] `whatsapp/configuracoes.html`
- [ ] `conversas/interface-chat.html`
- [ ] `conversas/enviar-mensagens.html`
- [ ] `conversas/historico.html`
- [ ] `clientes-pets/cadastro-clientes.html`
- [ ] `clientes-pets/cadastro-pets.html`
- [ ] `clientes-pets/familias.html`
- [ ] `agendamentos/criar-agendamento.html`
- [ ] `agendamentos/calendario.html`
- [ ] `agendamentos/gerenciar.html`
- [ ] `catalogo/adicionar-servicos.html`
- [ ] `catalogo/gerenciar-catalogo.html`
- [ ] `analytics/dashboard.html`
- [ ] `analytics/metricas.html`
- [ ] `analytics/relatorios.html`
- [ ] `ia-config/personalidade.html`
- [ ] `ia-config/horarios.html`
- [ ] `ia-config/testar-ia.html`

## 🤝 Contribuindo

1. Mantenha a consistência de design
2. Use emojis com moderação 🎯
3. Teste responsividade (mobile/tablet/desktop)
4. Valide HTML: https://validator.w3.org/
5. Otimize imagens antes de adicionar

## 📄 Licença

Este tutorial faz parte do projeto Auzap.ai.

---

**Criado com 💝 pela equipe Auzap.ai**