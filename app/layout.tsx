import "./css/style.css";

import { Inter } from "next/font/google";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Devicefield",
  description: "Your partner in digital creation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Removed "scroll-smooth" from className below */
    <html lang="en">
      <body
        className={`${inter.variable} bg-gray-50 font-inter tracking-tight text-gray-900 antialiased`}
      >
        <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          {children}
        </div>

        {/* DeviceField Analytics Script */}
        <Script id="devicefield-pixel" strategy="afterInteractive">
          {`
            (function() {
              // CONFIGURATION
              const PROJECT_ID = "wpnwkawyheooovygldbq"; // User replaces this
              // const ENDPOINT = "https://devicefield.com/api/track"; // Your domain
              const ENDPOINT = "/api/track";

              // Track Page View
              function trackView() {
                fetch(ENDPOINT, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    projectId: PROJECT_ID,
                    eventType: "view",
                    path: window.location.pathname,
                    referrer: document.referrer
                  })
                }).catch(err => console.log("Analytics error:", err));
              }

              // Track Clicks (Optional - simplest version)
              document.addEventListener("click", function(e) {
                // You can refine this to only track specific buttons if you want
                fetch(ENDPOINT, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    projectId: PROJECT_ID,
                    eventType: "click",
                    path: window.location.pathname
                  })
                }).catch(() => {});
              });

              // Run on load
              trackView();
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
