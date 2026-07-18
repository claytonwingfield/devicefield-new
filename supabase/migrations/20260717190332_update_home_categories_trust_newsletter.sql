UPDATE public.site_pages
SET content = content::jsonb
  || jsonb_build_object(
    'focusAreas',
    jsonb_build_array(
      'Barcode & Inventory',
      'Receipt & Label Printing',
      'POS Hardware',
      'Networking & Uptime',
      'Business Software',
      'Troubleshooting'
    ),
    'trustStrip',
    jsonb_build_array(
      'Hands-on when stated',
      'Specs independently verified',
      'Affiliate-supported',
      'Corrections welcomed',
      'Updated regularly'
    ),
    'categoryEyebrow',
    'Coverage',
    'categoryHeading',
    'Business technology categories Devicefield covers.',
    'categoryIntro',
    'Focused guides for the hardware, software, and reliability problems businesses run into every day.',
    'categoryEntries',
    jsonb_build_array(
      jsonb_build_object(
        'title',
        'Barcode & Inventory',
        'description',
        'Scanners, inventory workflows, SKU labeling, and stock-counting systems.'
      ),
      jsonb_build_object(
        'title',
        'Receipt & Label Printing',
        'description',
        'Receipt printers, label printers, thermal media, drivers, and replacement planning.'
      ),
      jsonb_build_object(
        'title',
        'POS Hardware',
        'description',
        'Terminals, tablets, cash drawers, stands, card readers, and retail counter setups.'
      ),
      jsonb_build_object(
        'title',
        'Networking & Uptime',
        'description',
        'Routers, failover, backup power, Wi-Fi coverage, and business continuity gear.'
      ),
      jsonb_build_object(
        'title',
        'Business Software',
        'description',
        'POS platforms, inventory apps, reporting tools, and systems that connect operations.'
      ),
      jsonb_build_object(
        'title',
        'Troubleshooting',
        'description',
        'Fixes for printer pairing, scanner setup, network drops, and hardware compatibility issues.'
      )
    ),
    'newsletterEyebrow',
    'Free checklist',
    'newsletterHeading',
    'Get the Business Technology Checklist',
    'newsletterIntro',
    'A practical checklist for selecting POS hardware, scanners, printers, networking equipment, and backup power.'
  )
WHERE slug = 'home';

UPDATE public.blog_posts
SET category = 'Business Software'
WHERE slug IN ('small-business-operations-stack-2026', 'how-we-test-business-tools')
  AND category IN ('Business Systems', 'Buying Guides', 'AI Tools', 'Operations');

UPDATE public.blog_posts
SET category = 'Networking & Uptime'
WHERE slug = 'remote-work-security-checklist-lean-teams'
  AND category = 'Security';
