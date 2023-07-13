const { i18n } = require('./next-i18next.config');

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  reactStrictMode: true,

  webpack(config, { isServer, dev }) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },

  images: {
    domains: ['localhost', 'gdldiwtaingbnreeyuoj.supabase.co', 'tlzqgrjdkmblgtbmalki.supabase.co', 'cdn.discordapp.com']
  },
};

module.exports = withPWA(nextConfig);
