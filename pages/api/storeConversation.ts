import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { wrapApiHandlerWithSentry } from '@sentry/nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RequestBody {
  title: string;
  prompts: any[];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { title, prompts } = req.body as RequestBody;

    if (!title || !prompts) {
      res.status(400).json({ error: 'Missing title or prompts parameter' });
      return;
    }

    // Generate a unique accessible_id
    const accessible_id = uuidv4();

    try {
      const { error } = await supabase
        .from('share_conversations')
        .insert([
          {
            accessible_id: accessible_id,
            title: title,
            prompts: JSON.stringify(prompts),
          },
        ]);

      if (error) {
        res.status(500).json({ error: 'Error storing data' });
        return;
      }

      res.status(200).json({ message: 'Conversation stored successfully', accessible_id });
    } catch (error) {
      res.status(500).json({ error: 'Error storing data' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

export default wrapApiHandlerWithSentry(
  handler,
  '/api/storeConversation',
);
