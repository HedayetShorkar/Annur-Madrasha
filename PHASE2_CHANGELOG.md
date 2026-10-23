# Phase 2 change log — 2026-10-14

## Phase 1 issues addressed
- Mobile navigation was hidden without a replacement menu: added an accessible disclosure menu, link/outside/Escape closing and breakpoint reset.
- No theme control existed: added persistent light/dark selection, safe blocked-storage fallback and early initialization; corrected light-only section and admission colors.
- Previous generic `.bad ~ .er` rule exposed unrelated errors: restricted messages to the corresponding field and added aria-invalid state.
- Audio play rejection was unhandled: added a visible playback-error message.
- Original “Most Popular” claim had no supporting evidence: replaced it with a factual curriculum label. Hid unverified reference discounts, preserving monthly plan prices and the source data.

## Public site improvements
- Preserved branding, teacher artwork and original page content structure.
- Sticky responsive header, Explore disclosure, current-link indicators, Courses and Student Login entries, admission CTA and extended footer links.
- Refined hero hierarchy, logo presentation, three-step learning introduction, spacing and restrained card styling.
- Moved four embedded WebP images to reusable local files without changing any image bytes.
- Replaced runtime canvas/background packing with a subtle CSS geometric hero motif. This removes the previous rotated-verse background treatment and repeated full-section bitmap generation; it does not claim a measured Lighthouse improvement.
- Removed automatic review rotation; retained manual controls. Reduced sample review cards from five to three; all remain explicitly labeled samples.
- Added explicit unverified teacher labels, pending-policy notice and package confirmation copy.
- Added clearly unavailable Courses/Login views, with bilingual titles/metadata. No password fields or fake authentication.

## Retained behavior
Bengali/English switching, admission demo and selection summary, teacher dialogs, audio file preview/player, all nine international clock choices, package curriculum, FAQ disclosures and review demo.

## Checkpoint
Exact original uploaded ZIP included under checkpoints/. The Phase 1 reports and original backup remain for provenance. Current verification is in TEST_RESULTS.md; Phase 1 reports describe historical work only.

## Phase 2.1 visual restoration — user feedback
- Restored the exact Phase 1 Quran-verse typography renderer and 8% RGBA opacity on its original homepage sections and footer, including font-load and resize refresh. The original hero Arabic heading remains.
- Removed Phase 2 overrides that suppressed logo breathing/glow and expanding rings. Original br/rp keyframes apply again.
- Restored the clock's rotating dotted orbit and blinking live indicator by removing the animation override.
- Refreshed the verse background when navigating back to the homepage.
- Retained the system reduced-motion accessibility setting.
- These changes supersede the earlier changelog entry about replacing the verse backgrounds.

## Phase 2.2 — text contrast
Improved FAQ hover, open and keyboard-focus colors in both themes. Added explicit foreground/background pairs for all three plan CTAs, including hover/focus and dark mode. Removed low-opacity curriculum exclusions. Preserved restored logo, typography and clock animations.

## Phase 2.3 — heading and logo refinement
Set explicit dark-green/light-gold FAQ heading colors by theme. Reduced logo breathing scale to 1.012 and halo to 16–22px at low opacity. Made two gold wave outlines clearer, staggered by three seconds, without extra glow. Reduced-motion remains respected.

## Phase 2.4 — title and header brand
Strengthened FAQ title to weight 800 and explicit deep-green/warm-gold colors. Removed the active-location underline from the header brand only; retained navigation active indicators and keyboard focus outlines. Increased both brand lines’ weight and contrast in light/dark themes.

## Phase 2.5 — inclusive public messaging
Rewrote Bangla and English hero, introduction, learning benefits, plans, global section, admission introduction, footer and FAQ wording to welcome learners in Bangladesh and abroad. Updated HTML title, metadata, JSON-LD description and runtime SEO strings. Main message: দেশে কিংবা প্রবাসে—সবার জন্য কুরআনের আলো। Existing admission age rules and guardian requirements were not changed by this copy edit.

## Phase 2.6 — default theme and FAQ heading
First visit now defaults to light mode irrespective of OS theme; an explicitly saved dark/light preference still wins. Blocked storage falls back to light. Dark-mode FAQ heading uses deep green on an explicit off-white backing for reliable contrast, replacing pale gold.

## Phase 2.7 — approved admission age
Owner confirmed admission is for ages 5–18 only; no separate adult program. Updated HTML input constraints, integer age validation, bilingual errors, eligibility note and the FAQ age answer. Other policy answers remain placeholders.

## Phase 2.8 — approved FAQ answers
Added six owner-supplied answers, polished in Bangla and English: worldwide applications; Zoom classes; ages 5–18; availability-based scheduling and batch times; administration follow-up; bKash/Nagad/Rocket fees. Removed FAQ sample-answer notice. No online payment integration or account numbers added.
