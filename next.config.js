/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep the learning app's build practical on laptops and shared workstations.
    cpus: 1,
    // The handbook and allowlisted source reader load repository files at runtime.
    outputFileTracingIncludes: {
      '/learn/**/*': [
        './astra docs/*.md', './src/**/*', './tests/*.test.ts',
        './prisma/schema.prisma', './prisma/seed.ts',
        './README.md', './CONTRIBUTING.md', './package.json', './tsconfig.json',
      ],
    },
  },
};

module.exports = nextConfig;
