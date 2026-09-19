(function () {
  const root = document.documentElement;
  const toggleBtn = document.getElementById('langToggle');

  function applyLang(lang) {
    const dict = I18N[lang] || I18N.en;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) el.placeholder = dict[key];
    });
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.title = lang === 'ar' ? 'XIII — مطوّر بوتات محادثة' : 'XIII — Chatbot Developer';
    if (toggleBtn) toggleBtn.textContent = lang === 'ar' ? 'EN / عربي' : 'EN / عربي';
    try {
      localStorage.setItem('xiii-lang', lang);
    } catch (e) {
      /* private browsing / blocked storage - non-fatal */
    }
    window.dispatchEvent(new CustomEvent('xiii:langchange', { detail: { lang } }));
  }

  function initialLang() {
    try {
      const saved = localStorage.getItem('xiii-lang');
      if (saved === 'ar' || saved === 'en') return saved;
    } catch (e) {
      /* ignore */
    }
    return navigator.language && navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  }

  let currentLang = initialLang();
  applyLang(currentLang);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      currentLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLang(currentLang);
    });
  }

  // Subtle reveal-on-scroll for sections/cards.
  const revealTargets = document.querySelectorAll('.section, .project-card, .skill-card');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach((el) => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }
})();

// ---------------- Live chat demo widgets ----------------
(function () {
  const BOT_META = {
    lumora: { cls: 'salon', title: { en: 'Lumora Beauty Studio', ar: 'صالون لومورا للتجميل' } },
    wanderly: { cls: 'travel', title: { en: 'Wanderly Travel & Tours', ar: 'واندرلي للسفر والسياحة' } },
    brightpath: { cls: 'academy', title: { en: 'BrightPath Academy', ar: 'أكاديمية برايت باث' } },
    xiii: { cls: 'xiii', title: { en: 'Ask about XIII', ar: 'اسأل عن XIII' } },
  };

  function currentLang() {
    return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatBotText(text) {
    return escapeHtml(text)
      .replace(/\*(.+?)\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function addMsg(messagesEl, text, who) {
    const div = document.createElement('div');
    div.className = 'msg ' + who;
    if (who === 'bot') div.innerHTML = formatBotText(text);
    else div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function addTyping(messagesEl) {
    const div = document.createElement('div');
    div.className = 'msg bot typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function queueReplies(messagesEl, replies, delayEach) {
    let t = 0;
    replies.forEach((reply, i) => {
      t += i === 0 ? 500 : 350;
      setTimeout(() => {
        const typing = addTyping(messagesEl);
        setTimeout(() => {
          typing.remove();
          addMsg(messagesEl, reply, 'bot');
        }, 450);
      }, t);
    });
  }

  function initWidget(container) {
    const messagesEl = container.querySelector('[data-messages]');
    const form = container.querySelector('[data-input-form]');
    const input = container.querySelector('[data-input]');
    let botId = container.getAttribute('data-bot');
    let bot = window.DemoBots[botId];
    let session;

    function updateHeader() {
      const meta = BOT_META[botId];
      const header = container.querySelector('[data-bot-header]');
      if (!header) return;
      header.className = 'phone-header ' + meta.cls;
      const titleEl = header.querySelector('[data-bot-title]');
      if (titleEl) titleEl.textContent = meta.title[currentLang()];
      else header.innerHTML = '<span data-bot-title>' + meta.title[currentLang()] + '</span>';
    }

    function setBot(id) {
      botId = id;
      bot = window.DemoBots[botId];
      container.setAttribute('data-bot', botId);
      updateHeader();
      greet();
    }

    function greet() {
      messagesEl.innerHTML = '';
      session = window.DemoBots.newSession();
      session.lang = currentLang();
      const { replies } = bot.handleMessage(session, '');
      replies.forEach((r) => addMsg(messagesEl, r, 'bot'));
    }

    updateHeader();
    greet();

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        addMsg(messagesEl, text, 'user');
        input.value = '';
        const { replies } = bot.handleMessage(session, text);
        queueReplies(messagesEl, replies);
      });
    }

    window.addEventListener('xiii:langchange', () => {
      updateHeader();
      session.lang = currentLang();
      greet();
    });

    return { setBot };
  }

  function init() {
    if (!window.DemoBots) return;
    document.querySelectorAll('[data-widget]').forEach((container) => {
      const widget = initWidget(container);
      const tabsWrap = container.closest('.hero-demo, .faq-panel')
        ? container.parentElement.querySelector('[data-tabs]')
        : null;
      if (tabsWrap) {
        tabsWrap.querySelectorAll('[data-bot-tab]').forEach((btn) => {
          btn.addEventListener('click', () => {
            tabsWrap.querySelectorAll('[data-bot-tab]').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            widget.setBot(btn.getAttribute('data-bot-tab'));
          });
        });
      }
    });

    const fab = document.querySelector('[data-faq-fab]');
    const panel = document.querySelector('[data-faq-panel]');
    if (fab && panel) {
      fab.addEventListener('click', () => panel.classList.toggle('open'));
      const closeBtn = panel.querySelector('[data-faq-close]');
      if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.remove('open'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
