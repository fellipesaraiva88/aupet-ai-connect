/**
 * Auzap.ai Tutorial - JavaScript Interativo
 */

// ==========================================
// Gerenciamento de Progresso
// ==========================================

class TutorialProgress {
  constructor() {
    this.storageKey = 'auzap_tutorial_progress';
    this.progress = this.loadProgress();
  }

  loadProgress() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : {
      completedPages: [],
      currentPage: null,
      lastVisited: null
    };
  }

  saveProgress() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
  }

  markPageComplete(pageId) {
    if (!this.progress.completedPages.includes(pageId)) {
      this.progress.completedPages.push(pageId);
      this.saveProgress();
      this.updateUI();
    }
  }

  setCurrentPage(pageId) {
    this.progress.currentPage = pageId;
    this.progress.lastVisited = new Date().toISOString();
    this.saveProgress();
  }

  getCompletionPercentage() {
    const totalPages = document.querySelectorAll('.nav-link').length;
    const completed = this.progress.completedPages.length;
    return totalPages > 0 ? Math.round((completed / totalPages) * 100) : 0;
  }

  updateUI() {
    // Atualizar barra de progresso
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    if (progressBar && progressText) {
      const percentage = this.getCompletionPercentage();
      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${percentage}% completo`;
    }

    // Marcar páginas completadas na navegação
    this.progress.completedPages.forEach(pageId => {
      const navLink = document.querySelector(`[data-page-id="${pageId}"]`);
      if (navLink && !navLink.classList.contains('completed')) {
        navLink.classList.add('completed');
        navLink.insertAdjacentHTML('beforeend', ' ✓');
      }
    });
  }
}

// ==========================================
// Funcionalidade de Busca
// ==========================================

class TutorialSearch {
  constructor() {
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    this.initializeSearch();
  }

  initializeSearch() {
    if (!this.searchInput) return;

    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      if (query.length < 2) {
        this.hideResults();
        return;
      }

      this.performSearch(query);
    });

    // Fechar resultados ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        this.hideResults();
      }
    });
  }

  performSearch(query) {
    const navLinks = document.querySelectorAll('.nav-link');
    const results = [];

    navLinks.forEach(link => {
      const text = link.textContent.toLowerCase();
      if (text.includes(query)) {
        results.push({
          title: link.textContent,
          url: link.href,
          icon: link.querySelector('.nav-link-icon')?.textContent || '📄'
        });
      }
    });

    this.displayResults(results, query);
  }

  displayResults(results, query) {
    if (!this.searchResults) return;

    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="search-no-results">
          <p>Nenhum resultado encontrado para "${query}"</p>
        </div>
      `;
    } else {
      this.searchResults.innerHTML = results.map(result => `
        <a href="${result.url}" class="search-result-item">
          <span class="search-result-icon">${result.icon}</span>
          <span class="search-result-title">${this.highlightQuery(result.title, query)}</span>
        </a>
      `).join('');
    }

    this.searchResults.style.display = 'block';
  }

  highlightQuery(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  hideResults() {
    if (this.searchResults) {
      this.searchResults.style.display = 'none';
    }
  }
}

// ==========================================
// Copy to Clipboard
// ==========================================

function setupCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const codeBlock = button.closest('.code-snippet').querySelector('code');
      const code = codeBlock.textContent;

      try {
        await navigator.clipboard.writeText(code);

        // Feedback visual
        const originalText = button.textContent;
        button.textContent = '✓ Copiado!';
        button.style.background = 'rgba(52, 199, 89, 0.2)';

        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
        }, 2000);
      } catch (err) {
        console.error('Erro ao copiar:', err);
        button.textContent = '✗ Erro';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    });
  });
}

// ==========================================
// Accordion
// ==========================================

function setupAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const accordion = header.parentElement;
      const content = accordion.querySelector('.accordion-content');
      const isOpen = accordion.classList.contains('open');

      // Fechar todos os outros accordions
      document.querySelectorAll('.accordion.open').forEach(other => {
        if (other !== accordion) {
          other.classList.remove('open');
          other.querySelector('.accordion-content').style.maxHeight = null;
        }
      });

      // Toggle atual
      if (isOpen) {
        accordion.classList.remove('open');
        content.style.maxHeight = null;
      } else {
        accordion.classList.add('open');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}

// ==========================================
// Tabs
// ==========================================

function setupTabs() {
  document.querySelectorAll('.tabs').forEach(tabsContainer => {
    const tabs = tabsContainer.querySelectorAll('.tab');
    const panels = tabsContainer.nextElementSibling?.querySelectorAll('.tab-panel');

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        // Remover active de todos
        tabs.forEach(t => t.classList.remove('active'));
        panels?.forEach(p => p.classList.remove('active'));

        // Adicionar active ao clicado
        tab.classList.add('active');
        if (panels && panels[index]) {
          panels[index].classList.add('active');
        }
      });
    });
  });
}

// ==========================================
// Checklist Interativa
// ==========================================

function setupChecklists() {
  document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(checkbox => {
    // Carregar estado salvo
    const checklistId = checkbox.closest('.checklist')?.id;
    const itemId = checkbox.id;
    const storageKey = `checklist_${checklistId}_${itemId}`;

    const saved = localStorage.getItem(storageKey);
    if (saved === 'true') {
      checkbox.checked = true;
    }

    // Salvar mudanças
    checkbox.addEventListener('change', () => {
      localStorage.setItem(storageKey, checkbox.checked);

      // Adicionar animação
      const item = checkbox.closest('.checklist-item');
      if (checkbox.checked) {
        item.style.background = 'rgba(52, 199, 89, 0.1)';
        setTimeout(() => {
          item.style.background = '';
        }, 300);
      }
    });
  });
}

// ==========================================
// Theme Toggle
// ==========================================

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  // Carregar tema salvo
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// ==========================================
// Smooth Scroll
// ==========================================

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ==========================================
// Tooltips
// ==========================================

function setupTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(element => {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-content';
    tooltip.textContent = element.getAttribute('data-tooltip');
    element.appendChild(tooltip);
  });
}

// ==========================================
// Inicialização
// ==========================================

let tutorialProgress;

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar gerenciador de progresso
  tutorialProgress = new TutorialProgress();

  // Marcar página atual
  const currentPageId = document.body.getAttribute('data-page-id');
  if (currentPageId) {
    tutorialProgress.setCurrentPage(currentPageId);
  }

  // Atualizar UI
  tutorialProgress.updateUI();

  // Inicializar funcionalidades
  new TutorialSearch();
  setupCopyButtons();
  setupAccordions();
  setupTabs();
  setupChecklists();
  setupThemeToggle();
  setupSmoothScroll();
  setupTooltips();

  // Adicionar animações de entrada
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.card, .alert, .demo-container').forEach(el => {
    observer.observe(el);
  });

  // Botão de "Marcar como completo"
  const completeButton = document.getElementById('mark-complete');
  if (completeButton) {
    completeButton.addEventListener('click', () => {
      const pageId = document.body.getAttribute('data-page-id');
      if (pageId) {
        tutorialProgress.markPageComplete(pageId);

        // Feedback visual
        completeButton.textContent = '✓ Completo!';
        completeButton.style.background = '#34C759';
        completeButton.disabled = true;
      }
    });
  }
});

// Exportar para uso global
window.tutorialProgress = tutorialProgress;
