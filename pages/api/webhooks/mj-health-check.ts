export const config = {
  runtime: 'edge',
  preferredRegion: 'icn1',
};

const handler = async (req: Request): Promise<Response> => {
  // Send Slack notification if and only if status is 'FAILED'
  let messageId = 'N/A',
    errorMessage = 'N/A',
    prompt = 'N/A';
  try {
    const reqBody = await req.json();
    if (reqBody.status === 'FAILED') {
      messageId = reqBody.messageId;
      errorMessage = reqBody.error;
      prompt = reqBody.prompt;
    } else {
      return new Response('', { status: 200 });
    }
  } catch (error) {
    console.error(error);
    errorMessage = JSON.stringify(error);
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL || "";

  let slackMessage = 'Midjourney generation Error:\n';

  if (messageId) {
    slackMessage += `Message ID: ${messageId}\n`;
  }
  if (prompt) {
    slackMessage += `Prompt: ${prompt}\n`;
  }
  if (errorMessage) {
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

  return new Response('', { status: 200 });
};

export default handler;
