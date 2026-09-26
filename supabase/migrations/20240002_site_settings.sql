-- Migration: Site Settings Table for Dynamic Hero Banner & Configurations
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/customers) to read site settings
CREATE POLICY "Allow public read site_settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Allow authenticated admins to insert/update site settings
CREATE POLICY "Allow admin write site_settings"
  ON public.site_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Seed default hero banner
INSERT INTO public.site_settings (key, value)
VALUES (
  'hero_banner',
  '{
    "desktop_url": "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=3000&auto=format&fit=crop",
    "mobile_url": "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=3000&auto=format&fit=crop",
    "alt_text": "SXTN Streetwear Hero"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
