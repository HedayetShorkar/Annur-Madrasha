# Classroom page opening fix

Cause: website links targeted the `live/` directory; some local/static environments opened a directory listing. Absolute module assets in the earlier build also depended on a web server at the domain root.

All entry links now explicitly target `live/index.html`. Vite emits relative assets and an inline IIFE; portable-build.mjs changes the generated entry to a classic deferred script. This allows the designed login UI to execute when opened from disk and from a hosted subfolder. Actual media/auth still require the API and media server. A clear setup banner distinguishes local/static preview from connected login, and no local credentials are sent.

Checks passed: compiled-entry DOM execution under file and hosted-subfolder URLs, local API-call suppression, hosted login readiness, main HTML/assets/JS structure and existing package/preference logic. No visual browser or live media test was performed.
