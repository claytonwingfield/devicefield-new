/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/services/:path*",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/pricing",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/integrations",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/get-started",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/schedule",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/about",
        destination: "/blog/how-we-test-business-tools",
        permanent: true,
      },
      {
        source: "/create-project",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/signup",
        destination: "/",
        permanent: true,
      },
      {
        source: "/signin",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
