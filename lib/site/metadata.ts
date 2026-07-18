import type { Metadata } from "next";
import {
  SITE_NAME,
  SITE_SOCIAL_IMAGE_URL,
} from "@/lib/site/identity";

type PublicPageMetadataInput = {
  title: string;
  description: string;
  canonicalUrl: string;
  robots?: Metadata["robots"];
};

export function createPublicPageMetadata({
  title,
  description,
  canonicalUrl,
  robots,
}: PublicPageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: SITE_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: "Devicefield business technology publication",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE_SOCIAL_IMAGE_URL],
    },
  };
}
