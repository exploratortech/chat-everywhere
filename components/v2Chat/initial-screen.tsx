import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { useEffect, useState } from 'react';

import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';

import { ThemeSupa } from '@supabase/auth-ui-shared';

export const InitialScreen = () => {
  const supabase = useSupabaseClient();
  const [redirectUrl, setRedirectUrl] = useState<string>('');

  useEffect(() => {
    setRedirectUrl(window.location.href);
  }, []);

  return (
    <div className="v2-container flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md sm:max-w-sm">
        <CardHeader className="flex w-full justify-center">
          <div className="flex flex-col text-center">
            <a
              className="font-serif text-xl"
              href="https://intro.chateverywhere.app"
              target="_blank"
            >
              Chat Everywhere v2
            </a>
            <div className="mt-1 flex w-full justify-center">
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
            redirectTo={redirectUrl}
          />
          <div className="text-center text-xs text-neutral-400">
            By signing up, you agree to our
            <a
              href="https://intro.chateverywhere.app/terms-of-service.html"
              target="_blank"
              rel="noreferrer"
              className="ml-1 underline"
            >
              Terms of Service.
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
