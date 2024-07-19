const fetchWebSummary = async (url: string) => {
  try {
    const endpointHost = process.env.WEB_CONTENT_FUNCTION_ENDPOINT;
    const endpointSecret = process.env.WEB_CONTENT_FUNCTION_SECRET;
    if (!endpointHost)
      throw new Error('WEB_CONTENT_FUNCTION_ENDPOINT is not defined');
    if (!endpointSecret)
      throw new Error('WEB_CONTENT_FUNCTION_SECRET is not defined');

    const endpoint = new URL(endpointHost);
    endpoint.searchParams.append('url', url);
    const webContentResponse = await fetch(endpoint.toString(), {
      headers: {
        'x-web-content-function-secret': endpointSecret,
      },
    });
    const { content: webMdContent } = await webContentResponse.json();
    return {
      content: webMdContent as string,
    };
  } catch (error) {
    console.error(error);
    return {
      content: 'Unable to fetch web content. Please try other URL.',
    };
  }
};
export default fetchWebSummary;
