# Responsive website update — 24 October 2026

The public website, admission wizard, classroom portal and receipt desk now adapt to narrow phones, tablets, laptops and wide monitors while preserving the existing branding and approved admission policies.

## What changed

- A flexible header keeps the logo, language control, theme control and menu inside narrow screens. The compact navigation opens as a scrollable panel and still closes with Escape.
- Hero buttons, package cards, teacher cards, clock panels and feedback cards reflow according to the available width. Tablets use two columns where helpful, with a centred final card.
- The mobile admission guide uses six readable numbered controls plus the current section's title. Progress remains visible beneath the header. The lower action bar accounts for the safe area; short landscape screens use normal document flow to leave more room for fields.
- Form fields, calendar/time controls and touch controls have comfortable sizes. Long names, IDs and review text wrap within their cards. Feedback and rules dialogs stay within the viewport and can scroll.
- Classroom login, setup forms, class actions, account lists and monitoring containers fit narrow screens. The activity table has a named, keyboard-focusable horizontal scrolling region.
- The receipt editor and preview stack on tablets and phones. Preview details, totals, signature areas and office forms adapt to the available space. The receipt register is a named scrolling region. Screen refinements are scoped away from the existing A4 print layout.
- Removed a stale home-route call to the retired review carousel so the clock refresh is no longer interrupted by an undefined function.
- The GitHub packaging workflow rebuilds changed classroom/receipt sources before packaging, keeping compiled pages and the complete ZIP aligned.

## Verification

- Production builds passed for both React applications, including receipt TypeScript checking.
- All 11 existing public verification scripts passed: HTML/assets, preferences/clock/prices, admission wizard, fees, date/time controls, scheduling, Hifz, feedback, receipt UI, live access and portable classroom entry.
- Chromium browser checks passed for all six public pages at 320, 360, 390, 600, 768, 820, 1024, 1100, 1280, 1536, 1920 and 2560px iframe widths, at both 844px and 375px heights: **144 layouts**, with no document overflow or off-screen controls/headings.
- English/dark checks passed at 320, 768, 1280 and 2560px, at both heights: **48 layouts**. The classroom portal retains its existing Bangla/light presentation.
- Fictional administrator class/setup/audit pages, the student dashboard and the receipt register passed at 320, 768 and 1280px, at both heights: **30 additional layouts**. The complete browser matrix covered **222 layouts**.
- A real browser was used to progress through all six admission steps at 320px, including Hifz, a long student/guardian name, a preferred start date, specific times and switching to 24-hour format. The 375px-high check kept the progress guide below the header. No application was submitted.
- The 320px compact menu and feedback dialog were checked. The menu stayed within the 305px content viewport with a classic scrollbar; the feedback dialog's content had no internal horizontal overflow.

## Repeating the browser checks

Serve a public-only preview as described in the main README. Copy `tests/responsive-preview.html` to the preview root as `qa.html`, then open it over HTTP. The harness tests real iframe viewports and reports page overflow and off-screen controls; it does not emulate a particular physical device.

`tests/responsive-fixtures.cjs` uses jsdom to create fictional, script-free administrator/student snapshots from the compiled applications. Give it a public preview directory outside the project. These snapshots are layout fixtures; they are not real accounts or payment records and are not included in the public build or release package.

Browser verification used Chromium. Physical iOS/Android devices, camera/microphone behavior and live media connections were not exercised by these layout checks.
