This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Use Node.js 22 LTS (`nvm use`) and install the locked dependencies with `npm ci`.

Create `.env.local` with the following values from your Supabase project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-project-anon-key
```

Both values are required at build time and when the API runs. Use the public
anon key, never a Supabase service-role key. Keep the environment file untracked.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load the [Inter](https://fonts.google.com/specimen/Inter) font.

## Validation

```bash
npm ci
npm run lint
npx tsc --noEmit
npm test -- --runInBand
npm run build
npm audit --omit=dev
```

Tests mock Supabase and do not modify a live database. A build also downloads the
Inter font from Google. Successful unit tests and a build do not replace a
preview check of creating a tournament, editing a nickname, generating rounds,
recording scores, and opening history against a disposable Supabase project.

For an isolated production-server HTTP smoke check (Node 22, no real credentials):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-only-anon-key npm run build
node scripts/smoke-production.mjs
```

The script requires ports 54321 and 3100 to be free and refuses builds without
the test values. It starts an in-memory PostgREST stub and the production server,
checks pages/assets/RSC and tournament API persistence, then stops both. It does
not verify browser interactions, SQL constraints, RLS, or the Netlify runtime.
See [the Netlify investigation](docs/netlify-investigation.md) for evidence and
the remaining merge and production checks.

Next.js and `eslint-config-next` stay on the same patched Next 15 release.
The PostCSS override replaces Next's pinned 8.4.31 with a patched 8.x version
(including the fix for GHSA-fxqj-rqcc-2cmp). Recheck this override when upgrading
Next.js. Audit development dependencies separately with `npm audit`; an audit
of production dependencies does not cover the test and lint toolchain.

## Deploy on Netlify

The root `netlify.toml` sets `npm run build` and the `.next` publish directory.
Netlify uses `.nvmrc` and automatically installs its maintained Next.js adapter;
do not restore the old `@netlify/plugin-nextjs` dependency without a specific
compatibility reason.

Set both Supabase variables in Netlify with **Builds** and **Functions** scopes,
including the **Deploy Previews** context. Configure previews to use test data.
If a deploy fails, inspect its build log for the actual error; a failed status
alone does not establish that the Next.js update caused it. After upgrading,
verify both the new preview and the eventual production deployment refer to the
patched commit. Older production and preview deployments are not patched by
merging a pull request.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
