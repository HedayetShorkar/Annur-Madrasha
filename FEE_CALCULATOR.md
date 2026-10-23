# Admission fee estimate

Date editing was refreshed: `fee-start` is now a keyboard/mobile-accessible full-date select with quick choices; it is not a locked native date input. See [ADMISSION_DATE_TIME.md](ADMISSION_DATE_TIME.md). ISO dates and the calculation rules below remain unchanged.

The form offers a start date in the remaining current month, or the first day of the next month. Dates are based on Asia/Dhaka. For prorated enrolments, calendar days are counted inclusively from the enrolment date, including non-class days. Enrolment on days 1–7 costs the full monthly fee. From day 8 the integer minor-unit formula is round(monthly_minor * remaining_days / days_in_month). This month’s estimate uses today in Asia/Dhaka as the prospective enrolment date, independently of the preferred class start date. Next-month starts cost the full monthly fee. BDT and USD estimates follow the existing displayed package prices. February/leap years and month lengths are handled automatically. Full-month starts cost the full package price.

The form and package sidebar display the estimate. Invalid or past dates block submission. The rules notice appears above the form with a jump button, and the required consent explicitly acknowledges personal reading and understanding.

This is the admission demo calculator, not a payable invoice. The existing secure payment module continues to use server-issued billing charges; it never trusts this client quote. Start-date approval, automatic issuance of prorated billing charges and refunds are not connected to the demo form. The user-facing estimate explicitly requires administration confirmation before actual billing.

Tests: tests/fees.cjs (requires jsdom), tests/schedule.cjs, tests/logic.cjs and tests/verify.py passed. No browser visual review was performed for this update.

Required student gender (boy/girl) sits beside the full name on desktop and below it on mobile. Fee boundary tests cover days 1, 2, 7 and 8 for all three package prices.
