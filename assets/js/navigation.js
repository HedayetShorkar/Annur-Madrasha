/* Phase 2 navigation, independent of the existing learning/admission UI. */
(function () {
  const root = document.documentElement;
  const nav = document.querySelector('.site-nav');
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('primary-menu');
  const theme = document.getElementById('theme-toggle');
  const more = document.querySelector('.nav-more');
  const compact = matchMedia('(max-width: 1100px)');
  let expanded = false;
  function setMenu(open, returnFocus = false) {
    expanded = open;
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    menu.hidden = compact.matches && !open;
    if (!open) more.open = false;
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setMenu(!expanded));
  compact.addEventListener('change', () => setMenu(false));
  document.addEventListener('click', event => {
    if (!nav.contains(event.target)) setMenu(false);
    if (!more.contains(event.target)) more.open = false;
    if (event.target.closest('#primary-menu a')) setMenu(false);
  });
  nav.addEventListener('focusout', () => {
    setTimeout(() => { if (!nav.contains(document.activeElement)) setMenu(false); }, 0);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
    if (more.open) { more.open = false; more.querySelector('summary').focus(); }
    else if (expanded) setMenu(false, true);
  });
  function syncTheme() {
    const dark = root.dataset.theme === 'dark';
    theme.setAttribute('aria-pressed', String(dark));
    theme.setAttribute('aria-label', root.lang === 'bn' ? 'ডার্ক থিম' : 'Dark theme');
    theme.title = root.lang === 'bn' ? (dark ? 'লাইট থিম চালু করুন' : 'ডার্ক থিম চালু করুন') : (dark ? 'Use light theme' : 'Use dark theme');
    theme.textContent = dark ? '☀' : '◐';
  }
  theme.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.style.colorScheme = root.dataset.theme;
    try { localStorage.setItem('annoor-theme', root.dataset.theme); } catch (_) {}
    syncTheme();
  });
  function markActive(hash) {
    document.querySelectorAll('.site-nav a[href]').forEach(a => {
      if (a.getAttribute('href') === hash) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    more.classList.toggle('has-active', !!more.querySelector('[aria-current]'));
  }
  function onRoute() { setMenu(false); markActive(location.hash || '#home'); }
  document.addEventListener('annoor:route', onRoute);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (document.getElementById('pg-home').hidden) return;
      const visible = entries.filter(entry => entry.isIntersecting);
      if (visible.length) markActive('#' + visible[0].target.id);
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    ['home','why','packages','teachers','global','faq','reviews'].forEach(id => observer.observe(document.getElementById(id)));
  }
  new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['lang'] });
  setMenu(false); syncTheme(); onRoute();
})();
