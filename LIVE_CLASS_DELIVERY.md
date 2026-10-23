# Live class module delivery

## What changed

The website now links to `/live/` from navigation, the existing student-login route and footer. The classroom module offers role-scoped accounts, assigned classes, server-derived live room status, visible supervision, silent previews, interactive video lessons, microphone moderation, join locking, end/remove controls, sampled attendance and audit logs.

Source is in `live-class/`, compiled browser assets in `live/`. Setup and production hosting instructions are in `live-class/README.md`; Nginx and systemd templates are in `live-class/deploy/`. The uploaded reference files are retained byte-for-byte in `live-class/reference/`.

## Architecture decision

The uploaded code used Jitsi with teacher login and public student entry. This implementation uses LiveKit for authenticated multi-room management and server-side media controls. It uses a separate Node/SQLite classroom service, so existing Supabase payment data, accounts and secrets are not changed. Single sign-on and admission/billing-to-roster automation are not included.

The app controls class access, not device permission. Cameras and microphones begin off. A supervisor appears with a labelled identity. Silent previews have no audio renderer or publish grant; interactive supervision can publish at the supervisor's own request. Up to four previews can be open at once; the dashboard lists all assigned/authorized rooms. Capacity across real networks has not been benchmarked.

## Validation

15 tests pass using actual SQLite/Express authentication and an injected media adapter. The LiveKit SDK token test is real, but network/video moderation calls in tests are simulated. Coverage includes role isolation, CSRF origin, cookie sessions, roster access, lock behavior, end/remove failures and retry, token races, password reset invalidation, upstream-error sanitization and independent room reconciliation. Production frontend build passes. A real Node process startup check also passed: unconfigured-media health and compiled-portal/static asset serving work. Public-only staging was checked to exclude environment files, databases and server source. Existing public HTML/assets/JS, package/preference and Hifz checks pass.

No real media-server, browser camera/microphone, screen-sharing or concurrent device test has been performed. The module is not deployed. No LiveKit credentials, production origin or hosting details were provided. Deployment is therefore a required remaining step, not a completed live service.

## Operational limits

Dashboard polling: six seconds. Sampled attendance/enforcement: approximately ten seconds while the worker and media API are healthy. Locking prevents fresh student token issuance; already-issued tokens may connect before expiration. Removing/ending first persists the access restriction, then attempts media disconnection/deletion, with periodic retry. It is not instantaneous token revocation. Muting affects current microphones, with self-unmute still possible. Recording is not configured.

For production, configure the media endpoint and server-only keys in the environment, create the first administrator through the bootstrap command, and run the documented two-device acceptance checks. Never upload the full project source tree to the web server's public directory; use the provided staging script.
