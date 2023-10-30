import { AppInsightsContext } from '@microsoft/applicationinsights-react-js';
import { Session, SessionContextProvider } from '@supabase/auth-helpers-react';
import { ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import 'react-notion-x/src/styles.css';
import { QueryClient, QueryClientProvider } from 'react-query';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from 'nextjs-google-analytics';

import { enableAzureTracking, reactPlugin } from '@/utils/app/azureAppInsights';
import { initializeMixpanel, initializePosthog } from '@/utils/app/eventTracking';

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

const WrapWithProvider: React.FC<WrapWithProviderProps> = ({ children }) => {
  if (enableAzureTracking)
    return (
      <AppInsightsContext.Provider value={reactPlugin}>
        {children}
      </AppInsightsContext.Provider>
    );
  else return <>{children}</>;
};

function App({ Component, pageProps }: AppProps<{ initialSession: Session }>) {
  const queryClient = new QueryClient();
  const [supabase] = useState(() => createBrowserSupabaseClient());

  useEffect(() => {
    initializeMixpanel();
    initializePosthog();
  }, []);

  return (
    <WrapWithProvider>
      <SessionContextProvider
        supabaseClient={supabase}
        initialSession={pageProps.initialSession}
      >
        <div className={inter.className}>
          <Toaster />
          <QueryClientProvider client={queryClient}>
            <Component {...pageProps} />
            <GoogleAnalytics trackPageViews strategy="lazyOnload" />
          </QueryClientProvider>
        </div>
      </SessionContextProvider>
    </WrapWithProvider>
  );
}

export default appWithTranslation(App);
