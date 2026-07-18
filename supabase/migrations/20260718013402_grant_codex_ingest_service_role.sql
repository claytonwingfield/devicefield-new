GRANT SELECT ON public.authors TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.blog_posts TO service_role;
GRANT SELECT ON public.affiliate_links, public.affiliate_programs
  TO service_role;
GRANT INSERT ON public.article_products TO service_role;
