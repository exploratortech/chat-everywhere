import { withAxiom } from 'next-axiom';
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
    domains: [
      'localhost',
      'gdldiwtaingbnreeyuoj.supabase.co',
      'tlzqgrjdkmblgtbmalki.supabase.co',
      'api.chateverywhere.app',
      'cdn.discordapp.com',
      'cdn.midjourney.com',
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ];
  },
};

module.exports = withAxiom(withPWA(nextConfig));
