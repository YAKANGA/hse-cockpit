/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark native Node.js packages as server-only — never bundled for the browser
  serverExternalPackages: ["better-sqlite3", "bcryptjs"],

  // Empty turbopack config silences the webpack/turbopack mismatch warning
  turbopack: {},
};

export default nextConfig;
