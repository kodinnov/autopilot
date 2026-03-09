/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js to treat pg as a server-side external package (not bundled)
  serverExternalPackages: ['pg', 'pg-native'],
};

export default nextConfig;
