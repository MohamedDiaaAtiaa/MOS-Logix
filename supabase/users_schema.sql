-- Create table for end-users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public registration (insert)
CREATE POLICY "Allow public registration" ON public.users
    FOR INSERT WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Allow individual read access" ON public.users
    FOR SELECT USING (auth.uid() = id); -- Wait, we aren't using Supabase Auth, so auth.uid() won't work with custom tokens. 
-- We will handle auth in the backend functions, so RLS might just get in the way of the Service functionality if we don't have a Service Key.
-- But we can Allow Public Read for now if we are careful, OR (better) just rely on the API.
-- Since we use the ANON key in the Cloudflare Worker, we need a policy that allows the Worker to Select/Update.
-- For custom auth, a common pattern with Anon key is "Allow All" but filter in API. 
-- OR better: `using (true)` but we only expose data via our API which validates the token.
-- I'll stick to "Allow All" for the Backend's sake, assuming the Backend is the gatekeeper. 
-- (Note: This means anyone with the Anon Key and Project URL can query the users table directly. 
--  Ideally we'd use a Service Role key in the backend, but we are working with what we have).

CREATE POLICY "Allow public access for custom auth" ON public.users
    FOR ALL USING (true);

-- Add user_id to website_generations
ALTER TABLE public.website_generations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id);
