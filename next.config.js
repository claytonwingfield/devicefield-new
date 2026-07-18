/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.devicefield.com" }],
        destination: "https://devicefield.com/:path*",
        permanent: true,
      },
      {
        source: "/blog/how-we-test-business-tools",
        destination: "/review-methodology",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
