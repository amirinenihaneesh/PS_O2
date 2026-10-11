Director's Eye is a Next.js camera-planning workspace with optional Supabase authentication and project storage.

## Getting Started

## Supabase setup

Director's Eye should use its own second Supabase project, separate from the Public Problems App project.

1. In Supabase, choose **New project** and create a second project for Director's Eye.
2. Copy the new project's URL and publishable key from **Settings -> API** into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. In the new project, open **SQL Editor -> New query**.
4. Paste and run [`supabase/directors-eye-schema.sql`](supabase/directors-eye-schema.sql).

This creates the `director_projects` and `director_references` tables, owner-only RLS policies, and the private `director-references` storage bucket in the second project.

To verify the migration, run this in the SQL Editor:

```sql
select to_regclass('public.director_projects') as projects_table,
	   to_regclass('public.director_references') as references_table;
```

Both values should return their table names.

## Run locally

Start the development server:

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
