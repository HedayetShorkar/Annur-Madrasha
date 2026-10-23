// Apply before first paint. Only display preferences are stored, never user data.
(function () {
  let theme = 'light'; // First visit defaults to light, regardless of OS preference.
  try {
    const saved = localStorage.getItem('annoor-theme');
    if (saved === 'dark' || saved === 'light') theme = saved;
    const language = localStorage.getItem('annoor-language');
    if (language === 'bn' || language === 'en') document.documentElement.lang = language;
  } catch (_) {}
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
