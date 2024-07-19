import type { VercelRequest } from '@vercel/node';

export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
  regions: [
    'arn1',
    'bom1',
    'cdg1',
    'cle1',
    'cpt1',
    'dub1',
    'fra1',
    'gru1',
    'hnd1',
    'iad1',
    'icn1',
    'kix1',
    'lhr1',
    'pdx1',
    'sfo1',
    'sin1',
    'syd1',
  ],
};

const handler = async (req: VercelRequest): Promise<Response> => {
  const url = new URL(req.url || '');
  const query = url.searchParams.get('q') || '';
  const width = url.searchParams.get('width') || '960';
  const height = url.searchParams.get('height') || '640';

  const unSplashKeys = (process.env.UNSPLASH_ACCESS_KEYS || '').split(',');
  const randomKey =
    unSplashKeys[Math.floor(Math.random() * unSplashKeys.length)];

  const unsplashUrl = `https://api.unsplash.com/photos/random/?query=${query}&client_id=${randomKey}&count=1&orientation=${width > height ? 'landscape' : 'portrait'}`;

  try {
    const response = await fetch(unsplashUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image from Unsplash');
    }

    const data = await response.json();
    const imageUrl = data[0]?.urls?.raw;

    if (!imageUrl) {
      return new Response(null, {
        status: 307,
        headers: {
          Location: `${url.origin}/server-busy-image.png`,
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    }

    const resizedImageUrl = `${imageUrl}&w=${width}&h=${height}&q=70`;

    console.log('Resized Image URL:', resizedImageUrl);

    return new Response(null, {
      status: 307,
      headers: {
        Location: resizedImageUrl,
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return new Response('Error fetching image', { status: 500 });
  }
};

export default handler;
