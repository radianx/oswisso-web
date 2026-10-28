# Netlify PR #26 investigation — 2026-10-28

## Conclusion

The **new hosted failure is diagnosed**: deploy
[6ae25c710c8a39f8f7115575](https://app.netlify.com/projects/torneocartonero/deploys/6ae25c710c8a39f8f7115575),
commit `04e08ff7f250e2ba660ca67ec41613781f160aba`, fails because at least one
required Supabase public variable is absent or empty during the build. The
historical October 17 failure remains undiagnosed. No reproducible application
or adapter build defect was found in PR head `0de8645b12bda3bbfbd1b26f22f10a15eb68b8e4`.
Keep #26 in draft pending a successful hosted Netlify preview and real browser
validation against disposable Supabase. Preserve all existing security updates.

## Evidence checked

- [PR #26](https://github.com/radianx/oswisso-web/pull/26) is open/draft. Main still
  declares Next 15.2.4. The PR locks Next/eslint-config-next 15.5.28, React/React DOM
  19.1.10, Sharp 0.35.5 and the PostCSS override 8.5.30. Manifests agree with the
  lockfile. No dependency changes were made in this investigation.
- GitHub combined status on `0de8645`: Vercel success, Netlify preview failure.
  The three Netlify checks (Pages changed, Header rules, Redirect rules) all say
  `Deploy failed`, with no text or annotations. Their names do not identify the
  failing build phase or prove three separate defects.
- [Failed deploy 6ad3cfba74c0970654c68b56](https://app.netlify.com/projects/torneocartonero/deploys/6ad3cfba74c0970654c68b56)
  identifies `0de8645`. In this investigation's unauthenticated browser the log
  panel returns `This resource could not be found`; login/signup are offered.
  The page's generic “in progress” heading conflicts with GitHub's completed
  failure and must not be taken as a new build result. No authenticated log was
  obtained. No real credentials were accessed.
- No Netlify connector was returned by integration discovery. The GitHub
  connector rejected a deployments-collection read as an unsupported endpoint.
  The actual active production deployment and its installed versions remain
  unverified.

## New remote evidence after pushing the validation changes

The new preview exposed an expandable public build log. Its Building section
(lines 73–89) shows successful compilation, followed by page-data collection
and `Error: Missing Supabase environment variables` from
`.next/server/app/api/tournament/route.js`, then
`Failed to collect page data for /api/tournament`. The command exits 1; Netlify
reports stage exit 2. This directly matches the local missing-variable
reproduction. The guard in `lib/supabase.ts` checks both values together, so the
log does **not** distinguish which variable is missing, empty, incorrectly
scoped, or withheld from this deploy context. No database request is needed to
trigger this error.

Initializing confirms Node **22.23.4**, npm **10.9.9**, successful installation of
631 packages and Next **15.5.28**. Building confirms @netlify/build **37.7.0**,
Next Runtime **5.16.3**, root `/opt/build/repo/netlify.toml`, `deploy-preview`
context, no restored Next cache, and a UI-installed `@netlify/plugin-nextjs`.
The resolved environment lists `NETLIFY_NEXT_PLUGIN_SKIP` and `REVIEW_ID`; their
values are not shown. The skip flag needs review before declaring adapter
runtime validation complete, but it did not produce the observed missing-env
exception. This build stops before Functions bundling/upload.

**Required remediation:** an authorized Netlify administrator must make both
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` available to this
preview in Builds and Functions, using a disposable Supabase project, then
rebuild. Check contextual overrides and PR-variable withholding rules without
disabling those protections globally. Do not put real keys or fake production
fallbacks into the repository. The current unauthenticated session cannot
inspect or change those account settings. No credentials were accessed.

The new failure establishes the current blocker. It does not establish that
the inaccessible October 17 log had the same cause.

## Configuration and hypotheses

| Item | Observed | What remains unknown |
| --- | --- | --- |
| Supabase | `lib/supabase.ts` throws at import without both public variables. Next imports API modules during page-data collection. Missing-variable build reproduced. | New preview proves at least one absent/empty at build time; exact variable and scope/withholding cause still require account access. Historical configuration unknown. |
| Node | `.nvmrc` specifies 22; engines require >=22. Local Node 22.23.4 succeeds. | New build uses Node 22.23.4/npm 10.9.9 and the repository root. Functions runtime remains untested. No Node failure demonstrated. |
| Adapter | Recognized root `netlify.toml`, build `npm run build`, publish `.next`, no legacy plugin pin, default Next config, nodejs API routes. Automatic local adapter 5.16.3 succeeds. | New build uses 5.16.3 with a UI plugin and an unresolved NETLIFY_NEXT_PLUGIN_SKIP flag. Historical settings unknown. No adapter failure demonstrated. |
| Fonts | Build uses `next/font/google` Inter and needs outbound font downloads. Local builds succeed. | Remote download errors, if any. No font failure demonstrated. |

Netlify recommends automatic adapter updates for Next >=13.5:
[Next.js support](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).
The existing patched Next target matches the
[October 14 advisory](https://nextjs.org/blog/nextjs-security-update-october-14-2026).
Do not downgrade Next/React, restore the legacy adapter, disable validation, or
substitute dummy production settings to make a status green.

## Fresh local validation

Application code and lockfile: PR head `0de8645`; added validation helper, docs
and generated-output exclusions only. Node **22.23.4**, npm **11.9.0**, Linux.

| Check | Result |
| --- | --- |
| Clean `npm ci` with lifecycle scripts enabled | Pass, 631 packages |
| `npm run lint` | Pass; `next lint` deprecation warning only |
| `npx tsc --noEmit` | Pass |
| `npm test -- --runInBand` | Pass, 2 suites / 5 tests |
| `npm run build`, no Supabase configuration | Fails: `Missing Supabase environment variables`, then `Failed to collect page data for /api/tournament` |
| Same build with loopback URL and fake key | Pass |
| Production-server HTTP smoke, local in-memory PostgREST stub | Pass: 8 pages, 20 assets, RSC, tournament create/read/update, nicknames, persisted score serialization, current/history/directory APIs, DELETE missing-ID 400 |
| `npm audit --omit=dev` | 0 vulnerabilities |
| Full `npm audit` | 17 findings: 6 high, 2 moderate, 9 low, 0 critical; dev-toolchain findings remain. Counts differ from the October 17 report; audit results are time-dependent. |
| Netlify CLI 27.15.0 `build --offline --context deploy-preview` | Pass: @netlify/build 37.7.1, automatic Next Runtime 5.16.3, Next build and internal server-handler Functions bundling complete |

The Netlify CLI was installed outside the app dependencies. Its adapter was
installed automatically under ignored `.netlify/`; neither was added to the
application lockfile. The offline flag avoids loading remote account settings;
package/font downloads still occur. No site was linked and nothing was deployed.
This proves local adapter packaging, not cloud execution, platform upload,
remote cache/config equivalence, or compatibility of the historical adapter.

Reproduce the HTTP smoke with the README commands. The script refuses builds
without the explicit test values because NEXT_PUBLIC values are embedded during
compilation. It does not load `.env` files, and overrides runtime Supabase values.
Netlify packaging transforms the `.next` output; run a fresh ordinary Next build
before the HTTP smoke if a Netlify build was run in the same checkout.

## Exact evidence needed from Netlify

Obtain the complete downloadable build log for deploy
`6ad3cfba74c0970654c68b56`, including installation, resolved configuration,
framework/adapter detection, build, onBuild/onPostBuild, Functions bundling,
post-processing and upload. Include the **first real error, stack trace and exit
code**, not just the final “build failed” summary.

Record these non-secret settings alongside it:

- Commit SHA, deploy context, build image, Node/npm versions, adapter name/version.
- Effective repository/base/package/publish directories and build command;
  dashboard-installed plugins, version overrides and skip/disable flags.
- Presence (yes/no), scopes and deploy-context selection of
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; never export values.
- Cache restoration messages and the result of one fresh build without cache.
- If build/packaging passes but upload fails, the deploy error and phase. If the
  deploy publishes but requests fail, request IDs and sanitized Function logs.

The new preview has a proven Supabase configuration failure. Do not assign a
Node/adapter cause or infer the historical cause without matching log evidence.

## Merge and production gates

1. Diagnose the historical log or obtain a new failure log on the exact reviewed
   commit. If the old log is unavailable, explicitly record that limitation and
   validate a new preview; do not rewrite the historical cause as known.
2. Build a new Netlify Deploy Preview using the reviewed SHA, Node 22, the
   maintained adapter and disposable Supabase values in Builds and Functions,
   including Deploy Previews. Confirm green build/packaging/upload and functioning
   API routes, assets and RSC through the preview URL. Record the adapter version.
3. In a browser, create a tournament, add/search/edit players, generate a round,
   record results, advance rounds, reload and verify timer/leaderboard/history.
   Check console/network errors and persistence after reload. Verify schema,
   constraints and RLS with the disposable anon key. Local stub/unit checks do
   not establish these behaviors or production database permissions.
4. Re-run locked installation, lint, typecheck, Jest, production build, local
   smoke and production audit on the final SHA. Review outstanding development
   audit findings separately; do not use forced downgrades to satisfy audit.
5. Merge only after the hosted gates pass. Record the resulting merge SHA and
   the successful **published production** deployment ID. In provider metadata,
   confirm its commit equals the merged patched tree and the live custom domain
   points to it. Preserve the build log showing locked Next 15.5.28 and confirm
   React/React DOM 19.1.10 and Sharp >=0.35.5 from the installed dependency tree
   or build artifact. A preview, PR status, main's package.json or HTTP
   `x-powered-by: Next.js` alone does not prove production's version.
6. Perform non-destructive production page/asset/RSC/read-only API checks; use
   an explicitly isolated test tenant for write flows. Check Functions errors
   and remove or restrict still-accessible vulnerable historical deployments.

## Changes in this follow-up

Added a repeatable local smoke helper, its runbook and this evidence report;
ignored Netlify's generated output. Running Jest after the local Netlify build
reproduced a `Haste module naming collision: oswisso-web` warning because the
generated standalone output contains a second package.json. Excluded `.netlify`
and `.next` from Jest's module indexing and reran all five tests successfully.
This local tooling warning is not evidence of the hosted failure.
No application defect fix is claimed and no
security dependency was changed. The confirmed missing-configuration error is
an intentional configuration requirement, not something to conceal with
fallback credentials.
