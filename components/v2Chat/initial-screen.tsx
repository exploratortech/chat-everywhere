import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';

import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';

import { ThemeSupa } from '@supabase/auth-ui-shared';

import { useEffect, useState } from 'react';

export const InitialScreen = () => {
  const supabase = useSupabaseClient();
  const [currentHostname, setCurrentHostname] = useState<string | null>('');

  useEffect(() => {
    setCurrentHostname(window.location.href);
  }, []);


  const getURL = () => {
    let url = currentHostname;
    url = `https://${url}/v2`;
    return url;
  };

  return (
    <div className="v2-container flex flex-col min-h-screen justify-center items-center">
      <Card className="w-full max-w-md sm:max-w-sm">
        <CardHeader className="flex justify-center w-full">
          <div className="text-center flex flex-col">
            <a className="text-xl font-serif" href='https://intro.chateverywhere.app' target='_blank'>Chat Everywhere v2</a>
            <div className="w-full flex justify-center mt-1">
              <Badge variant={'outline'} className="w-fit">
                Beta
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
            }}
            providers={['google']}
            redirectTo={getURL()}
          />
          <div className="text-xs text-neutral-400 text-center">
            By signing up, you agree to our
            <a
              href="https://intro.chateverywhere.app/terms-of-service.html"
              target="_blank"
              rel="noreferrer"
              className="underline ml-1"
            >
              Terms of Service.
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
