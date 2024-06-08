export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handleFailedStatus = async (reqBody: any) => {
  const messageId = reqBody.messageId || 'N/A';
  const errorMessage = reqBody.error || 'N/A';
  const prompt = reqBody.prompt || 'N/A';

  const webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
  let slackMessage = 'Midjourney generation Error:\n';

  if (messageId !== 'N/A') {
    slackMessage += `Message ID: ${messageId}\n`;
  }
  if (prompt !== 'N/A') {
    slackMessage += `Prompt: ${prompt}\n`;
  }
  if (errorMessage !== 'N/A') {
    slackMessage += `Error: ${errorMessage}`;
  }

  const slackPayload = {
    text: slackMessage,
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });
  } catch (error) {
    console.error('Failed to send Slack notification', error);
  }
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const reqBody = await req.json();
    if (reqBody.status === 'FAILED') {
      await handleFailedStatus(reqBody);
    } else {
      // TODO: Handle other status (E.X. update mj queue job info)
      return new Response('', { status: 200 });
    }
  } catch (error) {
    console.log('Failed to handle request', error);
  }

  return new Response('', { status: 200 });
};

export default handler;
