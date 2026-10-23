# Parent reviews upgrade

The homepage's **অভিভাবকদের মতামত** section now uses a balanced editorial layout: an invitation and feedback topics alongside a bordered experience journal. The green/gold brand, Quran background typography, Bangla/English language switching and light/dark preferences are retained. No fictitious testimonials, ratings, review counts or verified-customer badges have been introduced. The empty state is rendered directly in HTML, including before JavaScript loads; the old empty carousel/arrows were removed.

The redesigned dialog includes guardian name, country, an optional accessible 1–5 star rating with clear/reset, a 600-character counter, writing guidance, publication consent and an escaped draft preview. The preview can be edited or explicitly copied. Closing and reopening retains the draft in memory; refreshing clears it. No parent/child data is stored in browser storage, sent to a new service or automatically published.

**Review submission remains unconnected.** This is disclosed before writing. The online-submit button is disabled; preview/copy work independently. A programmatic submit is also guarded and cannot display fake success. Actual public reviews will require the future receiving, moderation and publication service plus real consented review data.

Changed: `index.html`, `assets/css/reviews.css`, `assets/js/reviews.js`; obsolete review handlers removed from `assets/js/app.js`. Existing admission regression checks were updated to load the independent review controller.

Verified: HTML/asset/JavaScript checks, original brand-image hashes, feedback preview/escaping/rating/copy/privacy interactions and the existing admission wizard. No actual browser visual inspection or server deployment was performed in this environment.
