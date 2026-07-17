import "./css/style.css";

import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// 2. Configure Space Grotesk
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space", // This defines the CSS variable name
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://devicefield.com"),
  title: {
    default: "Devicefield - Tested devices and systems for modern businesses",
    template: "%s",
  },
  description:
    "Independent business device reviews, software comparisons, and operating system guides for modern teams.",
  openGraph: {
    siteName: "Devicefield",
    type: "website",
    url: "https://devicefield.com",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "impact-site-verification": "65f54530-8a64-40ab-be8e-132733dd624a",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body
        className="bg-gray-50 font-space tracking-tight text-gray-900 antialiased"
        suppressHydrationWarning
      >
        <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          {children}
        </div>
      </body>
    </html>
  );
}
