export const SITE_NAME = "Devicefield";
export const SITE_URL = "https://devicefield.com";
export const SITE_TITLE =
  "Devicefield | Business Technology Reviews & Buying Guides";
export const SITE_DESCRIPTION =
  "Independent reviews, buying guides, comparisons, setup help, and troubleshooting for POS, barcode, printing, networking, and business systems.";
export const SITE_LOGO_URL = `${SITE_URL}/images/logo1.PNG`;
export const SITE_SOCIAL_IMAGE_URL =
  `${SITE_URL}/images/devicefield-social-cover.png`;
export const SITE_SOCIAL_PROFILES: Array<{
  href: string;
  label: string;
}> = [
  { href: "https://x.com/devicefieldhq", label: "X" },
  {
    href: "https://www.instagram.com/devicefieldhq/",
    label: "Instagram",
  },
  {
    href: "https://www.facebook.com/profile.php?id=100095303211875",
    label: "Facebook",
  },
];

export const PRIMARY_AUTHOR_NAME = "Clayton Wingfield";
export const PRIMARY_AUTHOR_SLUG = "clayton-wingfield";
export const PRIMARY_AUTHOR_EXPERTISE = [
  "Retail systems",
  "Business automation",
  "Operational technology",
] as const;

export function getArticleUrl(slug: string) {
  return `${SITE_URL}/blog/${encodeURIComponent(slug)}`;
}

export function getAuthorUrl(slug: string) {
  return `${SITE_URL}/author/${encodeURIComponent(slug)}`;
}

export function getValidProfileUrls(values: string[]) {
  return Array.from(
    new Set(
      values.flatMap((value) => {
        try {
          const url = new URL(value);
          return url.protocol === "https:" ? [url.toString()] : [];
        } catch {
          return [];
        }
      }),
    ),
  );
}
