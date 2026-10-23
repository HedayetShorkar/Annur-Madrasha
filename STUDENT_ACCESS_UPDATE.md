# Permanent student IDs and private administration

The administrator creates student accounts with permanent cryptographically random classroom IDs. Passwords can be generated automatically. IDs have no expiry and remain stable through password reset, class changes, deactivation and reactivation. Only assigned active students receive media tokens. Disabling an account revokes application sessions; connected media removal still follows the documented reconciliation interval/connectivity limits.

Only administrators can create accounts, list all accounts, assign students, see audits and request supervision previews. Students see only their own assigned classes. Teachers retain their own teaching/moderation controls but cannot issue IDs or access central supervision. Public landing/login copy no longer advertises supervision. Identity migration is additive and preserves existing accounts/password hashes.

Admin operation: portal login with the bootstrap email/password → ক্লাস ও অ্যাকাউন্ট → স্থায়ী ক্লাস আইডি তৈরি → copy ID/password privately → assign to class. Student login uses issued ID/password. Staff email login works in the login-ID field. No default admin password exists.

Tests: 20 backend/SQLite/SDK tests and compiled UI role-visibility/credential tests pass. Portable local/hosted page execution and public HTML checks pass. No production deployment or real-camera test has been performed. Setup is documented in live-class/README.md. All site, admission, payment and classroom source/build files are included in the single website ZIP.
