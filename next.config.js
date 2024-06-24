const { withAxiom } = require('next-axiom');
const { i18n } = require('./next-i18next.config');
const CopyPlugin = require("copy-webpack-plugin");

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

    if (!dev && isServer) {
      webassemblyModuleFilename = "./../server/chunks/[modulehash].wasm";

      const patterns = [];

      const destinations = [
        "../static/wasm/[name][ext]", // -> .next/static/wasm
        "./static/wasm/[name][ext]",  // -> .next/server/static/wasm
        "."                           // -> .next/server/chunks (for some reason this is necessary)
      ];
      for (const dest of destinations) {
        patterns.push({
          context: ".next/server/chunks",
          from: ".",
          to: dest,
          filter: (resourcePath) => resourcePath.endsWith(".wasm"),
          noErrorOnMissing: true
        });
      }

      config.plugins.push(new CopyPlugin({ patterns }));
    }

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
