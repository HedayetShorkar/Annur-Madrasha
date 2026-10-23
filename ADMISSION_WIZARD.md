# Six-step admission wizard

The admission page now shows one section at a time:
1. Student: name, gender, address, age 5–18, reading level and conditional Hifz progress.
2. Guardian: name, relationship, WhatsApp and optional email.
3. Plan, class start and first-month estimate.
4. Availability (discuss together or a chosen time window), IANA zone, 12/24-hour selection and optional notes.
5. Full admission rules and required acceptance.
6. Grouped review with edit actions, privacy consent, information confirmation and submit.

Next validates the current/prior steps before advancing. Previous preserves all values. Only visited steps can be selected from the sticky step guide; moving forward to a visited step revalidates prerequisites. Enter in an earlier step advances rather than submitting. Final submit revalidates all steps. Reset clears entries and returns to step one. State is in memory only; no student details are persisted to browser storage.

The guide indicates the active step and stays under the site header. The rules preview can be read from the introduction without unlocking later steps or checking consent automatically. A final review uses text nodes to avoid interpreting entered content as HTML.

The existing admission submission endpoint remains unconnected. A valid final submission therefore retains the form and clearly reports that it was not submitted; no mock receipt or reference is generated. This change does not deploy the site or add intake persistence.

Passed: HTML/asset/JS checks, existing package/preference tests, fee and schedule regression checks, Hifz state checks, and comprehensive wizard DOM tests. Coverage includes invalid student/guardian/date/time data, Hifz, rules/consent gates, editing/back retention, attempted step skipping, revalidation, language changes, Enter, reset and honest offline submission. Native dialog show/close behavior is stubbed in the DOM test; browser visual and real keyboard-modal QA remain unperformed.
