import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';

import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';

import { ThemeSupa } from '@supabase/auth-ui-shared';

export const InitialScreen = () => {
  const supabase = useSupabaseClient();

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
      process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
      'http://localhost:3000/';
    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`;
    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    return url;
  };

  console.log(getURL());
  

  return (
    <div className="v2-container flex flex-col min-h-screen justify-center items-center">
      <Card>
        <CardHeader className="flex justify-center max-w-sm md:max-w-md">
          <div className="text-center flex flex-col">
            <p>Chat Everywhere v2</p>
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
