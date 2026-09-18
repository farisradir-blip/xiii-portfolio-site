(function () {
  const root = document.documentElement;
  const toggleBtn = document.getElementById('langToggle');

  function applyLang(lang) {
    const dict = I18N[lang] || I18N.en;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.innerHTML = dict[key];
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
