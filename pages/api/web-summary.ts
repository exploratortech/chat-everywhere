import { NextApiRequest, NextApiResponse } from 'next';
  
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { browserQuery } = req.query;
  const url = browserQuery as string;
  
  try{

    const endpointHost = process.env.WEB_CONTENT_FUNCTION_ENDPOINT
    if (!endpointHost) throw new Error("WEB_CONTENT_FUNCTION_ENDPOINT is not defined")

    const endpoint = new URL(endpointHost)
    endpoint.searchParams.append("url", url)
    const webContentResponse=  await fetch(endpoint.toString())
    const{content: webMdContent}= await webContentResponse.json()
        res.status(200).json({
      content: webMdContent 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
}
