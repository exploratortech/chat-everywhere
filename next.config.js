const { withAxiom } = require('next-axiom');
const { i18n } = require('./next-i18next.config');
const { join } = require('path');
const { access, symlink } = require('fs').promises;

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
    // Fix for mismatch in wasm file hash
    config.plugins.push(
      new (class {
        apply(compiler) {
          compiler.hooks.afterEmit.tapPromise(
            'SymlinkWebpackPlugin',
            async () => {
              // if (isServer) {
                const from = join(compiler.options.output.path, '../static');
                const to = join(compiler.options.output.path, 'static');

                try {
                  await access(from);
                  console.log(`${from} already exists`);
                  return;
                } catch (error) {
                  if (error.code === 'ENOENT') {
                    // No link exists
                  } else {
                    throw error;
                  }
                }

                await symlink(to, from, 'junction');
                console.log(`created symlink ${from} -> ${to}`);
              }
            // },
          );
        }
      })(),
    );
    // -----------
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
