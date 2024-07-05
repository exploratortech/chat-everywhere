import { Session, SessionContextProvider } from '@supabase/auth-helpers-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import 'react-notion-x/src/styles.css';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import { initializePosthog } from '@/utils/app/eventTracking';

import DefaultToaster from '@/components/ui/default-toaster';

import '@/styles/globals.css';
import '@/styles/transitionGroup.css';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism-tomorrow.css';

const inter = Inter({ subsets: ['latin'] });

function App({ Component, pageProps }: AppProps<{ initialSession: Session }>) {
  const queryClient = new QueryClient();
  const [supabase] = useState(() => createBrowserSupabaseClient());

  useEffect(() => {
    initializePosthog();
  }, []);

  return (
    <SessionContextProvider
      supabaseClient={supabase}
      initialSession={pageProps.initialSession}
    >
      <QueryClientProvider client={queryClient}>
        <div className={inter.className}>
          <DefaultToaster />
          <Component {...pageProps} />
          <GoogleAnalytics trackPageViews strategy="lazyOnload" />
        </div>
      </QueryClientProvider>
    </SessionContextProvider>
  );
}

export default appWithTranslation(App);
