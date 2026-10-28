# An-Noor website working agreement

## Active project

- Canonical repository: https://github.com/HedayetShorkar/Annur-Madrasha.git
- Working branch: `main`, unless an existing repository policy requires a pull request.
- This repository starts from the restored pre-WordPress v31 website. The separate WordPress v32 backup is not the active project; do not import it unless the user asks.
- The editable website source is at the repository root. `AnNoor_Payments.zip` is the complete downloadable package. The initial ZIP is the unchanged v31 package; repository-only instructions and ignore rules were added outside that initial ZIP.

## User-requested update workflow

The user explicitly requested on 2026-10-23 that every completed website update be saved to this repository. Treat that as ongoing authorization to commit and push relevant completed changes for this project. Do not repeatedly request confirmation for ordinary updates.

1. Read the latest repository state before editing; preserve unrelated work and history.
2. Make the requested changes in this checkout. Run checks appropriate to the change. Rebuild `live/` or `payments/` when their source changes, following the existing project documentation.
3. Refresh the same root `AnNoor_Payments.zip` after website changes. Run `python3 scripts/package-release.py` after staging the changed source, or allow the repository's **Update complete website package** workflow to build it after the source commit. The workflow packages the tracked source and commits the ZIP to `main`; wait for it to finish and fetch its commit before continuing. It does not deploy a website. Use one top-level `AnNoor_Payments/` folder and include the website, editable source, deployment examples, documentation and tests. Exclude the output ZIP itself, `.git/`, dependencies, caches, real environment files, runtime databases, logs and private student/payment records. Keep safe `.env.example` files. Do not recursively bundle previous release ZIPs; the existing documented recovery material may remain.
4. Verify the archive opens and includes the updated files. Review the Git diff for unintended changes or credentials.
5. Commit and push the completed changes to this repository. Never force-push or rewrite shared history. If branch protection requires a pull request, preserve it and report the pull request link.
6. Verify the remote commit, then give a concise Bangla update with both the complete updated ZIP download link and the repository or commit link. The user explicitly requires a complete ZIP after every update, as well as the repository update. If authentication or a remote error prevents publishing, state that clearly; do not claim that an upload succeeded.

## Existing product boundaries

- Mobile comes first: the owner expects roughly 80% of visitors on phones. Check the public pages, six admission steps, student/teacher/admin classroom views and receipt workflows at 320, 360, 390 and 412px as applicable. Keep touch controls readable, support keyboard/safe-area changes, and preserve desktop access. Browser-dependent features must disclose their real limits; local recording still requires a supported operator computer.
- For each update, explain the concrete improvement, its expected effect and what was actually measured. Keep SEO content accurate, avoid invented credentials/reviews/rankings, and distinguish prepared SEO files from activated domain/Search Console configuration.
- Keep the phone hero ordered as Bismillah → animated logo → main copy. Avoid showing the bottom shortcuts beside an already-visible action for the same destination. Keep the homepage compact, the FAQ answers open, and the emerald/ivory/champagne palette readable in both themes.
- Keep teacher portraits round with the original cutouts extending above their frames and tinted light-mode cards. Prominent live-class links use only the successful-admission device hint; that hint is never authentication. Trials/reviews do not enable it. Publish only real, consented, staff-approved guardian feedback.

- This is the An-Noor online madrasa, not the separate Dhulerchar examination-board application.
- Preserve the approved admission ages (5–18), fee policy, six-step form, package schedules and existing design unless the user requests a change.
- Keep admission/parent-review submission and payment/live-service readiness claims accurate. Source code in GitHub does not mean a production backend or media service is deployed.
- Do not expose secrets, real environment values or runtime data. Only documented public assets belong in a public hosting web root.
- Do not enable hosting, GitHub Pages, workflows with deployment side effects, or a new production service solely because code is being uploaded.

## Keep the repository compact

Update `docs/OPERATIONS.md` for current behavior and `docs/HISTORY.md` for delivery history. Do not add separate root update reports for each upgrade. Keep functional source, tests and deployment files when they serve distinct purposes.


## Safe future updates

- Keep production student accounts, permanent IDs, passwords, sessions, lessons, payments and receipts outside the code checkout/public/release folders. Code ZIPs and Git are not data backups. Never recreate accounts or change DB_PATH merely to publish new code.
- Before publishing, install from the three committed lockfiles, run `npm run build` when portal inputs change, and run `npm run check`. The package workflow runs these checks before it writes the release ZIP. Do not skip a failing check to finish an update.
- Production Node starts require an existing absolute DB_PATH and automatically verify a fresh private SQLite backup before startup migrations. Do not bypass this check, initialize a replacement empty DB or restore an old DB to undo a UI/code change. A bootstrap is an explicit first-install action only. Keep off-server backups and a tested retention/restore policy.
- Use new additive Supabase migrations and preserve already-applied migration files/history. Test migrations against existing data, IDs, constraints, audit and permissions. For destructive/incompatible changes, first prepare a specific data-preserving plan and verified backup. Do not run a production reset, seed or silent schema downgrade.
- Keep old/new API contracts compatible across releases. Prefer the host's atomic deployment or the tested `scripts/release-public.mjs` workflow. Preserve fingerprinted bundles for open tabs, revalidate private HTML, and roll back compatible code without restoring stale payment/student data. Do not automatically prune releases/backups.
- Updating GitHub does not deploy an unconfigured host. Preserve the established production environment; do not create hosting/media/payment services or new credentials to complete an ordinary update. After hosting is connected, publish only a tested release and report the actual deployment/health result.
- Give the verified full ZIP from `/workspace/scratch/` with its sandbox link plus the GitHub update. Do not use a temporary `/mnt/data/` download path. Verify ZIP contents and link target again before delivery.
