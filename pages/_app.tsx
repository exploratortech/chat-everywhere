import { Session, SessionContextProvider } from '@supabase/auth-helpers-react';
import { IconX } from '@tabler/icons-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { ToastBar, Toaster, toast } from 'react-hot-toast';
import 'react-notion-x/src/styles.css';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import { initializePosthog } from '@/utils/app/eventTracking';

import '@/styles/globals.css';
import '@/styles/transitionGroup.css';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism-tomorrow.css';

const inter = Inter({ subsets: ['latin'] });

//Wrapper for Azure App Insights, only used in production
interface WrapWithProviderProps {
  children: ReactNode;
}

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
          <Toaster>
            {(t) => (
              <ToastBar toast={t}>
                {({ icon, message }) => (
                  <>
                    {icon}
                    {message}
                    {t.className?.includes('toast-with-close-button') && (
                      <button onClick={() => toast.dismiss(t.id)}>
                        <IconX />
                      </button>
                    )}
                  </>
                )}
              </ToastBar>
            )}
          </Toaster>
          ;
          <Component {...pageProps} />
          <GoogleAnalytics trackPageViews strategy="lazyOnload" />
        </div>
      </QueryClientProvider>
    </SessionContextProvider>
  );
}

export default appWithTranslation(App);
