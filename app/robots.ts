import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/devicefield-editor-login", "/preview"],
    },
    sitemap: "https://devicefield.com/sitemap.xml",
  };
}
