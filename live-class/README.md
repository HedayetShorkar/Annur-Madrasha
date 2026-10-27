# An-Noor Live Classroom

The website supports embedded **Jitsi Meet** with self-hosted HS256 tokens or JaaS RS256 tokens. Existing LiveKit installations remain selectable. The private Node/SQLite service keeps administrator-issued student IDs, password sessions and assigned-class checks. See the [current Jitsi setup](../docs/OPERATIONS.md#jitsi-live-class-connection) before enabling a provider.

The supplied code under `reference/` remains unchanged as recovery/reference material; it is not the running server. This release does not enable anonymous student joins or the reference code's public registration flow. No real Jitsi domain or signing credentials have been supplied, and no media deployment or real camera/microphone call was performed.

**Provider differences:** Jitsi IFrame handles in-room moderation and visible silent previews. Without an additional trusted provider integration, server room metrics, forced media disconnection and verified attendance are unavailable; the dashboard says so. LiveKit retains its existing server-side controls and sampled attendance. Classroom accounts remain separate from the Supabase admission office.

## Existing LiveKit workflows (when VIDEO_PROVIDER=livekit)

- Administrator creates teacher/student accounts, schedules classes and assigns students.
- Teachers access only their own classes. Students access only assigned, unblocked classes.
- The dashboard displays all authorized classrooms, active media rooms and current connections, refreshed every six seconds. Connections include teachers and supervisors.
- Administrators can open up to four silent live previews at once. Their names are visible in each room. Other rooms remain visible as status cards. A supervisor may instead enter one classroom interactively and enable their own microphone/camera.
- Teachers/admins start or end classes, stop issuing new student access, mute currently published student microphones, and remove/block students. A single student's mute is also available.
- Video calls include participant tiles, microphone/camera controls, screen sharing and in-room chat through LiveKit components. Devices start off. Optional staff-only local recording is documented below; no provider/cloud recorder is enabled.
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
2. `node scripts/stage-public.mjs /srv/annoor/public` stages only `index.html`, `assets/`, `learn/`, `robots.txt`, `404.html`, `live/`, `payments/`, and `admin/` into an **empty** directory. Never serve the full source ZIP or its `.env`, database, backup, reference or server directories.
3. Set production variables in `/etc/annoor/live.env`: `NODE_ENV=production`, `APP_ORIGIN=https://your-domain.example`, `PORT=4100`, `DB_PATH=/var/lib/annoor-live/live.sqlite`, media credentials and `TRUST_PROXY_HOPS=1` for the single loopback Nginx proxy below. Configure a dedicated user and private writable data directory; the environment file should be readable only by the service user/root. Do not include the bootstrap password in the runtime file.
4. Bootstrap the administrator with the **same DB_PATH** in a trusted terminal. Then remove the bootstrap password. Use the provided systemd unit as a template and verify `/usr/bin/node` points to Node 24.19+.
5. Use `deploy/nginx.conf.example` inside your real HTTPS virtual host. The API listens on loopback only. The proxy overwrites forwarding headers; do not blindly trust arbitrary client `X-Forwarded-For` values.
6. Configure the selected Jitsi or LiveKit service with public HTTPS/media networking. Follow the Jitsi operations guide for token verification and moderator assignment. Nginx's classroom API proxy alone is not a media server.
7. Open `/live/` and test with two real devices on different networks before admitting students. Verify camera/mic permission, screen sharing, mobile reconnect, student isolation, mute, removal and room termination. Use the media provider's deployment guidance for load and capacity; concurrent-class capacity has not been benchmarked here.

The service is one Node API process with a persistent local SQLite database. For multiple API instances, migrate storage and rate limiting to shared services first. The existing LiveKit adapter requests a 100-participant room limit, including staff; Jitsi capacity and participant limits belong to its deployment. The number of simultaneous rooms depends on the media server and bandwidth; no unlimited-capacity claim is made.

## Shared access rules and LiveKit-specific media timing limits

- Session cookies are HttpOnly, SameSite=Strict and Secure in production. Session tokens are hashed in the database; role/enrolment checks run on the API, never only in the UI. Passwords are hashed using bcrypt.
- Both providers issue room-scoped join JWTs expiring 60 seconds after issuance. Jitsi permits five seconds of clock skew before issuance. Tokens are for joining; expiration does not promise termination of an ongoing media call. LiveKit: Room-admin credentials are never sent to the browser. Existing calls can continue beyond this initial JWT lifetime according to LiveKit reconnect behavior.
- **Lock means stop issuing new student tokens.** A token already issued before locking may connect during its remaining lifetime. It does not disconnect current students.
- LiveKit: removing a student marks the roster blocked before asking the media server to disconnect them. End marks the class ended before asking the media server to delete the room. The server retries cleanup via its ten-second reconciliation cycle and re-checks current identities. Previously issued or refreshed media credentials may briefly connect before that check, especially across different LiveKit deployments. These controls are not instantaneous global token revocation. Effective removal requires API worker and media API connectivity.
- LiveKit: one failed classroom cleanup does not stop checks for other classrooms. Errors are shown as unavailable/pending, not confirmed success. Mic mute affects currently published audio; students can unmute themselves. Forced unmute and persistent mic-permission restrictions are not implemented.
- Website class/access polling continues during active calls. Closing a class or removing its assignment closes the embedded website session on a successful poll (normally every six seconds). This does not control direct Jitsi sessions outside the website. LiveKit: Session expiration/logout stops application access, but logout is not a server-wide media revocation command. Account deactivation is enforced on connected identities by reconciliation.
- All supervision is visible. Optional staff-started local recordings display a website notice; there is no hidden participation or automatic recording. The release does not implement billing integration, recurring timetable generation, email delivery, MFA or self-service email password recovery. The administrator can reset teacher/student passwords; users can change their own passwords. Protect the administrator account and backup the database.

## Operations

- Health: `GET /api/live/health` reports API readiness and whether media credentials exist, not media connectivity.
- Schedule: dates entered in the dashboard use the operator device's local time; UTC is stored.
- Backups: stop the single API process before copying SQLite files, or use SQLite's supported online backup mechanism. Back up all persistent data including WAL when copying a running database; a plain copy of only the main file may omit recent writes. Test restoration before relying on it.
- Keep database, session and audit data private. Set retention for attendance/audit backups according to institutional policy.
- First admin recovery requires a trusted operator; bootstrap intentionally refuses when an admin already exists. Do not delete the database to reset a password.

## Validation performed

`npm test` uses actual SQLite/HTTP middleware and both provider adapters. It verifies Jitsi HS256 and JaaS RS256 signatures and authorization as well as the original LiveKit/receipt regressions. `npm run build` compiles the frontend. These tests do not replace a real media-server/device integration test.

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

Read [the office workflow](../docs/OPERATIONS.md#manual-receipts-printing-and-pdf) for manual entry, separate print/PDF actions, deployment and boundaries. The existing print endpoint revalidates issued status for both formats and audits `PRINT` or `PDF`; voided records cannot be newly exported. Online collection stays disabled. These manual receipts do not automatically synchronize with the future Supabase ledger; consolidate the claim stores before enabling online collection.

## Learning records and local recording

Open **পড়াশোনা ও অগ্রগতি** to select an assigned class. The teacher/admin can save a lesson topic, notes and homework, then enter attendance, reading stage (Qaida/Quran/Hifz), covered material, homework status and private feedback for each rostered student. Students can read their own evaluation and shared lesson only. These teacher-entered records are distinct from provider-sampled attendance. Optimistic versions prevent simultaneous edits silently overwriting each other.

On an admin class card, open **অংশগ্রহণকারী ও ব্যাচ** → **একই ব্যাচের পরবর্তী ক্লাস**, select the next date/time, and create a new room/session with active, unblocked students. Previous lesson/attendance/progress stay with their original class. This is an explicit next-session action, not automatic timetable generation.

In a joined class, its assigned teacher or the administrator can use **ক্লাসের রেকর্ড আপনার কম্পিউটারে**. First choose a local file if the browser offers it, then explicitly start recording and select the classroom tab with **Share tab audio** enabled. The optional own-voice microphone is separate from the conference mute switch and is clearly labelled. Missing tab audio or denied requested microphone prevents start. Use headphones to reduce echo. Press stop and wait for completion before closing the page; download-mode results require the download button.

Files stay on the recording computer. A teacher recording on their computer does not transfer that file to the owner's computer. For a local owner copy, the administrator must join and record on their own computer; staff may alternatively transfer a finished file outside this module. Nothing is uploaded, stored in Supabase or published in the future recorded-course section.

Back up SQLite before upgrading. Startup adds schema version 3 (`class_lessons`, `student_lesson_reports`, `local_recording_notices`) in the existing additive migration, preserving IDs, passwords, classes and receipts. See [operations, API, tests and browser limits](../docs/OPERATIONS.md#learning-records-and-local-recording).

## Phone classroom view and public SEO preparation

Joined students/teachers can expand the existing classroom into the available browser viewport and return without reconnecting the media iframe. This uses CSS rather than relying on device-specific fullscreen permission. The expanded toolbar keeps an exit button and any active recording notice visible, with safe-area and short-landscape sizing. This does not add mobile local-recording support: recording remains a supported-computer function, as described above.

From the repository root, stage the public release, then run `node scripts/prepare-seo.mjs /absolute/staged-public https://YOUR_REAL_DOMAIN` with the institution's actual HTTPS origin. Replace the placeholder; the script refuses placeholder/invalid hosts and source-tree output. It writes canonical/social URLs, the two public sitemap entries and the robots sitemap declaration only in the staging directory. Copy all staged files to the actual host. The source checkout intentionally has no guessed production canonical or sitemap URL. See [current operations](../docs/OPERATIONS.md#mobile-first-and-bangladesh-search-visibility).
