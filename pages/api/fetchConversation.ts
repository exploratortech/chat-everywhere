import { trackError } from '@/utils/server/azureAppInsights';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'POST') {
    const { accessible_id } = await req.json();

    const res = new Response();
    if (!accessible_id) {
      return new Response(
        JSON.stringify({ error: 'Missing accessible_id parameter' }),
        {
          status: 400,
        },
      );
    }

    try {
      const { data, error } = await supabase
        .from('share_conversations')
        .select('title, prompts')
        .eq('accessible_id', accessible_id)
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: 'Error fetching data' }), {
          status: 500,
        });
      }

      if (!data) {
        return new Response(
          JSON.stringify({
            error: 'No conversation found for the given accessible_id',
          }),
          {
            status: 404,
          },
        );
      }

      return new Response(
        JSON.stringify({ title: data.title, prompts: data.prompts }),
      );
    } catch (error) {
      console.error(error);
      //Log error to Azure App Insights
      trackError(error as string);
      return new Response(JSON.stringify({ error: 'Error fetching data' }), {
        status: 500,
      });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    });
  }
};

export default handler;
