-- Keep the production CMS records aligned with the current server-rendered UI.
-- Replace the JSON rather than merging so retired layout keys cannot survive.
INSERT INTO public.site_pages (slug, title, meta_description, content)
VALUES
  (
    'home',
    'Devicefield - Tested devices and systems for modern businesses',
    'Independent buying guides, product reviews, comparisons, setup guides, and troubleshooting articles for business devices and systems.',
    '{
      "eyebrow": "Independent reviews. Business-first.",
      "heading": "Tested devices and systems for modern businesses.",
      "intro": "Independent buying guides, compatibility notes, reviews, setup guides, and troubleshooting articles for business devices and systems.",
      "primaryCta": "Browse Buying Guides",
      "secondaryCta": "How we test",
      "trustStrip": [
        "Hands-on when stated",
        "Specs independently verified",
        "Affiliate-supported",
        "Corrections welcomed",
        "Updated regularly"
      ],
      "categoryEyebrow": "Coverage",
      "categoryHeading": "Business technology categories Devicefield covers.",
      "categoryIntro": "Focused guides for the hardware, software, and reliability problems businesses run into every day.",
      "categoryEntries": [
        {"title": "Barcode & Inventory", "description": "Scanners, inventory workflows, SKU labeling, and stock-counting systems."},
        {"title": "Receipt & Label Printing", "description": "Receipt printers, label printers, thermal media, drivers, and replacement planning."},
        {"title": "POS Hardware", "description": "Terminals, tablets, cash drawers, stands, card readers, and retail counter setups."},
        {"title": "Networking & Uptime", "description": "Routers, failover, backup power, Wi-Fi coverage, and business continuity gear."},
        {"title": "Business Software", "description": "POS platforms, inventory apps, reporting tools, and systems that connect operations."},
        {"title": "Troubleshooting", "description": "Fixes for printer pairing, scanner setup, network drops, and hardware compatibility issues."}
      ],
      "heroEvaluation": [
        {"title": "Compatibility", "description": "Does it work with the systems businesses already use?"},
        {"title": "Setup", "description": "How much time and technical effort does deployment require?"},
        {"title": "Reliability", "description": "How does it handle daily operation, reconnection, and failure?"},
        {"title": "Value", "description": "What is the real cost after accessories and subscriptions?"}
      ],
      "heroEvaluationLabel": "How we evaluate",
      "heroSteps": ["Research", "Verify", "Explain"],
      "featuredEyebrow": "Featured",
      "featuredHeading": "Practical buying guides",
      "latestEyebrow": "Latest",
      "latestHeading": "New from Devicefield",
      "evaluationEyebrow": "Evaluation system",
      "evaluationHeading": "Evidence for the decisions that affect daily operations.",
      "evaluationIntro": "Guides consider deployment effort, total cost, compatibility, reliability, and the practical limits a business needs to know before buying.",
      "evaluationFactors": [
        {"title": "Compatibility", "description": "Required systems, drivers, accessories, and integrations."},
        {"title": "Setup effort", "description": "The time and technical work needed to deploy it."},
        {"title": "Reliability", "description": "Daily operation, reconnect behavior, failure, and recovery."},
        {"title": "Total value", "description": "Purchase cost, subscriptions, supplies, and switching risk."}
      ],
      "newsletterEyebrow": "Free checklist",
      "newsletterHeading": "Get the Business Technology Checklist",
      "newsletterIntro": "A practical checklist for selecting POS hardware, scanners, printers, networking equipment, and backup power."
    }'::jsonb
  ),
  (
    'blog',
    'Business Technology Guides - Devicefield',
    'Browse Devicefield buying guides, product reviews, comparisons, setup notes, and troubleshooting help for business technology.',
    '{
      "eyebrow": "Field notes",
      "heading": "Reviews, comparisons, and operating guides.",
      "intro": "Buying guides, product reviews, comparisons, setup notes, and troubleshooting help for the devices and systems businesses rely on."
    }'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_description = EXCLUDED.meta_description,
  content = EXCLUDED.content,
  updated_at = TIMEZONE('utc'::text, NOW());
