# An-Noor Live Classroom

A first working implementation of website-based classes and central supervision. It contains a React frontend, a Node.js API, SQLite storage and a LiveKit media adapter. It does **not** yet have a deployed media server or verified real audio/video calls.

The supplied `server.js` and `LiveClassSecure.jsx` are retained under `reference/` unchanged. They showed a Jitsi teacher dashboard, but lacked central supervision, authenticated student assignments and durable attendance. The implementation uses LiveKit server room/participant APIs for these controls. It is not a Zoom account integration. Existing payments still use their separate Supabase module; classroom accounts are separate in this release.

## Included workflows

- Administrator creates teacher/student accounts, schedules classes and assigns students.
- Teachers access only their own classes. Students access only assigned, unblocked classes.
- The dashboard displays all authorized classrooms, active media rooms and current connections, refreshed every six seconds. Connections include teachers and supervisors.
- Administrators can open up to four silent live previews at once. Their names are visible in each room. Other rooms remain visible as status cards. A supervisor may instead enter one classroom interactively and enable their own microphone/camera.
- Teachers/admins start or end classes, stop issuing new student access, mute currently published student microphones, and remove/block students. A single student's mute is also available.
- Video calls include participant tiles, microphone/camera controls, screen sharing and in-room chat through LiveKit components. Devices start off. No recording is configured.
- Media-server snapshots record first/last observed presence and sample counts. This is not precise duration or proof of attentiveness. Very short visits between samples can be missed.
- Account deactivation, password change/reset, session invalidation and action audit logs are included.

## Local setup

Requires Node.js 24.19+ (uses `node:sqlite`) and npm. Commands below run in `live-class/`.

1. `npm ci`
2. Copy `.env.example` to `.env` and set `APP_ORIGIN=http://localhost:5173`.
3. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 16 characters. Run `npm run bootstrap` once. Remove `ADMIN_PASSWORD` afterwards. No default accounts exist.
4. Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` from a LiveKit Cloud project or a correctly configured self-hosted LiveKit deployment. Secrets stay on the API server; no `VITE_` variables are used.
5. Run `npm start` in one terminal and `npm run dev` in another. Open `http://localhost:5173/live/`. The Vite proxy forwards `/api/live/` to the local API.
6. Log in as administrator, create a teacher and a student, save the student’s generated classroom ID/password, create a class and assign the student. Students log in with their issued ID/password; teachers and the administrator use their account email in the same login-ID field. Log in with separate browser profiles to verify each role. Teachers start a class before students can join.

Without media credentials, account/class setup works and the UI states that video is unconfigured. It does not simulate successful calls.

## Deployment

1. Place source outside the web server's public directory, for example `/srv/annoor/source/`. Run `npm ci` and `npm run build` in `live-class/`. This writes the browser build to the adjacent `live/` folder.
2. `node scripts/stage-public.mjs /srv/annoor/public` stages only `index.html`, `assets/`, `live/`, and `payments/` into an **empty** directory. Never serve the full source ZIP or its `.env`, database, backup, reference or server directories.
3. Set production variables in `/etc/annoor/live.env`: `NODE_ENV=production`, `APP_ORIGIN=https://your-domain.example`, `PORT=4100`, `DB_PATH=/var/lib/annoor-live/live.sqlite`, media credentials and `TRUST_PROXY_HOPS=1` for the single loopback Nginx proxy below. Configure a dedicated user and private writable data directory; the environment file should be readable only by the service user/root. Do not include the bootstrap password in the runtime file.
4. Bootstrap the administrator with the **same DB_PATH** in a trusted terminal. Then remove the bootstrap password. Use the provided systemd unit as a template and verify `/usr/bin/node` points to Node 24.19+.
5. Use `deploy/nginx.conf.example` inside your real HTTPS virtual host. The API listens on loopback only. The proxy overwrites forwarding headers; do not blindly trust arbitrary client `X-Forwarded-For` values.
6. Configure LiveKit Cloud or deploy LiveKit separately with public TLS/WSS and the required WebRTC/TURN/UDP networking. Nginx's classroom API proxy alone is not a media server.
7. Open `/live/` and test with two real devices on different networks before admitting students. Verify camera/mic permission, screen sharing, mobile reconnect, student isolation, mute, removal and room termination. Use the media provider's deployment guidance for load and capacity; concurrent-class capacity has not been benchmarked here.

The service is one Node API process with a persistent local SQLite database. For multiple API instances, migrate storage and rate limiting to shared services first. A single class currently permits up to 100 media participants, including staff. The number of simultaneous rooms depends on the media server and bandwidth; no unlimited-capacity claim is made.

## Security and timing limits

- Session cookies are HttpOnly, SameSite=Strict and Secure in production. Session tokens are hashed in the database; role/enrolment checks run on the API, never only in the UI. Passwords are hashed using bcrypt.
- The media join JWT is room-scoped and lasts 60 seconds. Room-admin credentials are never sent to the browser. Existing calls can continue beyond this initial JWT lifetime according to LiveKit reconnect behavior.
- **Lock means stop issuing new student tokens.** A token already issued before locking may connect during its remaining lifetime. It does not disconnect current students.
- Removing a student marks the roster blocked before asking the media server to disconnect them. End marks the class ended before asking the media server to delete the room. The server retries cleanup via its ten-second reconciliation cycle and re-checks current identities. Previously issued or refreshed media credentials may briefly connect before that check, especially across different LiveKit deployments. These controls are not instantaneous global token revocation. Effective removal requires API worker and media API connectivity.
- One failed classroom cleanup does not stop checks for other classrooms. Errors are shown as unavailable/pending, not confirmed success. Mic mute affects currently published audio; students can unmute themselves. Forced unmute and persistent mic-permission restrictions are not implemented.
- Media status polling continues during active calls. Session expiration/logout stops application access, but logout is not a server-wide media revocation command. Account deactivation is enforced on connected identities by reconciliation.
- All supervision is visible; no hidden participation or recording. The release does not implement billing integration, recurring timetable generation, email delivery, MFA or self-service email password recovery. The administrator can reset teacher/student passwords; users can change their own passwords. Protect the administrator account and backup the database.

## Operations

- Health: `GET /api/live/health` reports API readiness and whether media credentials exist, not media connectivity.
- Schedule: dates entered in the dashboard use the operator device's local time; UTC is stored.
- Backups: stop the single API process before copying SQLite files, or use SQLite's supported online backup mechanism. Back up all persistent data including WAL when copying a running database; a plain copy of only the main file may omit recent writes. Test restoration before relying on it.
- Keep database, session and audit data private. Set retention for attendance/audit backups according to institutional policy.
- First admin recovery requires a trusted operator; bootstrap intentionally refuses when an admin already exists. Do not delete the database to reset a password.

## Validation performed

`npm test` uses actual SQLite and HTTP middleware with an in-memory media adapter; the token test uses the real LiveKit SDK. `npm run build` compiles the frontend. These tests do not replace a real media-server/device integration test.

Official references: [LiveKit rooms](https://docs.livekit.io/intro/basics/rooms-participants-tracks/rooms/), [participant management](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants/), [self-hosting](https://docs.livekit.io/home/self-hosting/), [React components](https://docs.livekit.io/reference/components/react/).

## Opening the ZIP locally

All main-site buttons point explicitly to `live/index.html`, avoiding a folder listing. The production build uses relative assets and a classic deferred IIFE entry, so the login design can be viewed by opening that file directly from disk. `npm run build` applies this packaging automatically; do not omit the portable-build step. In file previews, authentication is disabled and no credentials are sent. Hosted deployments require the Node API; static hosting by itself displays a connection-status notice and disables login.

The compiled-entry DOM test is `tests/portable-classroom.cjs` in the website root and requires jsdom. It verifies file URL execution, subfolder asset resolution, offline behavior and hosted login readiness. It is not a real WebRTC/browser-camera test.

## Permanent student classroom IDs

Administrator-only account creation now generates an ID such as `AN-XXXX-XXXX-XXXX-XXXX`. Each ID contains 80 random bits, is stored under a case-insensitive unique database index, and has no expiry. IDs are identifiers, not passwords: a password is also required. Leaving the password field empty generates a strong initial password; it is returned once to the authenticated admin and only its bcrypt hash is stored. It is not included in user lists, audit details or browser storage.

Admin workflow: log in with the bootstrap admin email/password, open **ক্লাস ও অ্যাকাউন্ট**, create the student, copy the generated ID/password privately, then assign that student to a class. A student's email is optional; siblings may share a guardian contact email. Teachers require an email. Student login by email is disabled; use the issued ID. Staff email login remains supported. There is no public registration or ID-generation endpoint.

To remove access, disable the account or block its roster membership. To restore it, reactivate/reassign the existing account. Its ID does not change after password resets, class changes, disable/reactivate or server restarts. Login sessions and initial media tokens still expire separately for security. Never create a second account merely to change a student's batch.

Existing databases migrate additively on startup. Existing students receive a generated ID once; their UUID, password hash, class assignments and prior records remain. Administrators can retrieve these IDs from the account list. Back up the database before upgrading. `users.login_id`, `users.contact_email`, the unique ID index and schema version 2 are added. No account deletion is performed.

Public pages no longer promote supervision. Preview/central-control/ID-issuance UI is rendered only for administrators; API checks independently reject students and teachers requesting these operations. Teachers keep moderation of their own lessons. A supervisor who joins a lesson is still visibly labelled to participants. This access restriction does not make supervision covert.

Validation: 20 SQLite/API/SDK tests pass, including the permanent-ID creation, migration, email-login rejection, password requirement, reset/reactivation stability and admin-only routes. Compiled UI tests verify no public/student/teacher supervision or ID-issuance controls, administrator credential issuance, and local/hosted login loading. Real media-device tests and deployment remain pending configuration.

## Manual receipt desk

The same authenticated administrator session now authorizes the receipt desk at `../payments/index.html`; its link appears only in the administrator's navigation. Teacher/student sessions have no receipt API permissions. Video-server configuration is not required for receipts.

`server/receipts.js` and the adjacent `../shared/receipt-core.mjs` add schema version 3, admin-only issuing/register/printing/voiding, integer money calculations, atomic receipt sequences, idempotency keys, unique provider/transaction references and audits. Keep **both** private `live-class/` and `shared/` on the server and back up the SQLite database before upgrading. Existing users, permanent IDs, classes and sessions are preserved.

Read `../RECEIPT_DESK_UPDATE.md` for the office workflow, deployment requirements and boundaries. Online collection stays disabled. These manual receipts do not automatically synchronize with the future Supabase ledger; consolidate the claim stores before enabling online collection.
