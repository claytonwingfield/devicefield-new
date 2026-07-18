INSERT INTO public.authors (slug, name)
VALUES ('clayton-wingfield', 'Clayton Wingfield')
ON CONFLICT (slug) DO NOTHING;
