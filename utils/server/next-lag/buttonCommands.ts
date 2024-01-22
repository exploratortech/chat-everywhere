const buttonCommand = async (button: string, buttonMessageId: string) => {
  const requestHeader = {
    Authorization: `Bearer ${process.env.THE_NEXT_LEG_API_KEY || ''}`,
    'Content-Type': 'application/json',
  };
  const buttonCommandsResponse = await fetch(
    'https://api.mymidjourney.ai/api/v1/midjourney/button',
    {
      headers: requestHeader,
      method: 'POST',
      body: JSON.stringify({
        button,
        buttonMessageId,
      }),
    },
  );

  try {
    if (!buttonCommandsResponse || !buttonCommandsResponse.ok) {
      throw new Error('Button commands failed');
    }

    const buttonCommandsResponseJson = await buttonCommandsResponse.json();
    return buttonCommandsResponseJson as {
      messageId: string;
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default buttonCommand;
