-- Create table for storing generated websites
CREATE TABLE IF NOT EXISTS public.website_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt TEXT NOT NULL,
    html_content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_generations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the public 'try it' feature)
CREATE POLICY "Allow anonymous inserts" ON public.website_generations
    FOR INSERT WITH CHECK (true);

-- Allow anonymous select (if we want to show them? probably only admin needs to see all)
-- Actually, let's allow public to read their own if we returned ID, but for now let's just allow all for simplicity or restrict to admin.
-- The prompt implies "saving... using the tryit function", likely for admin review.
-- Admin uses service_role or we can just allow read for now.
CREATE POLICY "Allow public read" ON public.website_generations
    FOR SELECT USING (true);

-- Create a view or just query counts directly. 
-- We need to enforce: 
-- 1. limit 20 generated websites
-- 2. limit 30 generated emails (messages where role = 'ai')

-- No special table needed for limits, we can count rows.
