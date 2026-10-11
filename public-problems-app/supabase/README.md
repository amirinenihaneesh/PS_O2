Steps to apply Supabase setup for Public Problems App

1) Run the SQL
- Open your Supabase project dashboard -> SQL Editor -> New Query.
- Copy the contents of `supabase/schema.sql` and run it.

2) Create a storage bucket
- In Supabase console go to `Storage` -> `New bucket`.
- Name the bucket `issues-images`.
- Set public/private according to your needs. For a quick MVP, you can set it to public.

3) Configure Policies (recommended)
- By default Supabase enables Row Level Security (RLS) on new tables. If RLS is enabled, create policies to allow authenticated users to insert/select.
- Example policy to allow authenticated users to insert into `issues`:
  - SQL: `auth.role() = 'authenticated'` as the check for inserts.

4) Test via Supabase UI
- Use `Table Editor` to insert sample rows and upload a file to storage.
- Verify the `image_url` is the public URL from the storage object's `Get public URL` action.

5) Fill `.env.local`
- Add your values in the project's `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
```

6) Run the app locally
- From your project folder run:

```powershell
# if npm is available
npm run dev
# or explicit path if PowerShell still blocks npm
& "C:\Program Files\nodejs\npm.cmd" run dev
```

7) Try the flows
- Open `http://localhost:3000`.
- Create a new issue with a photo; check Supabase `issues` table and `issues-images` storage.
- Open an issue page and add comments.

If you want, I can now mark the Supabase tables task completed and start the dev server for you. Reply with "start server" to have me run `npm run dev` in the workspace (I will use the correct npm executable for your environment).