# Admission schedule update

The latest date/time editing UI is documented in [ADMISSION_DATE_TIME.md](ADMISSION_DATE_TIME.md): larger labelled time cards, exact-hour defaults, partial-entry retention across format/language changes and bounded 15-minute adjustments. A form reset now clears both canonical hidden times and incomplete clock drafts.

Basic and Standard have five class days, Saturday–Wednesday. Premium has six class days, Saturday–Thursday. Public package cards, admission package options and the summary show these fixed days. Day selection is removed from the availability form.

Time selection defaults to 12-hour with AM/PM, with an explicit 24-hour switch. The custom hour/minute controls guarantee the requested format independently of browser locale. Switching preserves complete times. Shortcuts and the live summary use the selected format. Canonical hidden times remain HH:mm, with an IANA time zone; future backend integration must validate these independently. Same-day end times must follow start times. No booking is promised, and teacher/batch availability still determines the final time.

Guardian name remains required; a required relationship selection now accompanies it, with bilingual options for father, mother, brother, sister, grandparent or other guardian.

The admission form remains a demo with no submission persistence. The payment module is unchanged.

Validation: HTML/assets/JS checks and preference/package regression checks. Run the schedule interaction checks with jsdom installed: `NODE_PATH=/path/to/node_modules node tests/schedule.cjs`. Browser visual QA has not been performed for this update.
