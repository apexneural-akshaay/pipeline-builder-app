/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      // The webpack disk cache races with Windows file locks (antivirus/OneDrive),
      // producing ENOENT errors on .pack.gz files that ultimately break the dev server's
      // ability to serve compiled CSS. In-memory cache is faster and reliable in dev.
      config.cache = { type: "memory" };
    }
    return config;
  },
};
module.exports = nextConfig;
