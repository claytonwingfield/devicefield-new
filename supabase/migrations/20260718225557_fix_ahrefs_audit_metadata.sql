UPDATE public.site_pages
SET
  meta_description = CASE slug
    WHEN 'contact' THEN 'Contact Devicefield to submit corrections, share product information, ask editorial questions, or provide feedback about business technology coverage.'
    WHEN 'affiliate-disclosure' THEN 'Learn how Devicefield identifies affiliate links, earns commissions, protects editorial independence, and discloses commercial relationships.'
    WHEN 'terms' THEN 'Review the terms governing Devicefield articles, website features, intellectual property, external links, disclaimers, and acceptable use.'
    WHEN 'privacy' THEN 'Learn how Devicefield collects, uses, protects, and retains newsletter, analytics, affiliate referral, and website usage information.'
    ELSE meta_description
  END,
  updated_at = NOW()
WHERE slug IN ('contact', 'affiliate-disclosure', 'terms', 'privacy');
