/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/blog/how-we-test-business-tools",
        destination: "/review-methodology",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
