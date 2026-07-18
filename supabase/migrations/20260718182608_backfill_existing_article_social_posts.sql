INSERT INTO public.article_social_posts (article_id, platform, content)
SELECT
  blog_post.id,
  social_post.platform,
  social_post.content
FROM public.blog_posts AS blog_post
CROSS JOIN (
  VALUES
    (
      'x'::TEXT,
      $social_x$Will the Zebra DS2208 work with Shopify POS on your iPad or Android tablet? This researched guide maps POS Hub, direct USB/HID, Stocky, and the failure points to check before buying. https://devicefield.com/blog/zebra-ds2208-shopify-pos #RetailTech #ShopifyPOS$social_x$
    ),
    (
      'facebook'::TEXT,
      $social_facebook$The Zebra DS2208 works with Shopify POS, but the right connection depends on your tablet and workflow. This researched guide explains the POS Hub, Android Tablet Stand, direct USB/HID mode, Stocky limits, and the checks to make before buying cables or rolling the scanner to every register.

Review the compatibility paths and troubleshooting sequence: https://devicefield.com/blog/zebra-ds2208-shopify-pos$social_facebook$
    ),
    (
      'instagram'::TEXT,
      $social_instagram$The Zebra DS2208 is officially supported by Shopify POS, but “supported” does not mean every tablet, cable, and scanner mode works the same way.

This researched Devicefield guide breaks the setup into three practical paths: Shopify POS Hub, the Android-only USB-C Tablet Stand, and direct USB in HID mode. It also explains why checkout can work while Stocky does not, what the iPadOS requirement means for Hub users, and which failure checks to run before a factory reset.

Use it as a pre-purchase checklist or a register deployment reference. Link in bio.

#ShopifyPOS #BarcodeScanner #RetailHardware #InventoryManagement #SmallBusinessTech

Publisher reference: https://devicefield.com/blog/zebra-ds2208-shopify-pos$social_instagram$
    )
) AS social_post(platform, content)
WHERE blog_post.slug = 'zebra-ds2208-shopify-pos'
ON CONFLICT (article_id, platform) DO NOTHING;
