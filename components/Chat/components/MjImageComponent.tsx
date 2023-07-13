import React, { useContext, useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import HomeContext from '@/pages/api/home/home.context';

interface MjImageComponentProps {
  src: string;
  buttons: string[];
  buttonMessageId: string;
}

export default function MjImageComponent({
  src,
  buttons,
  buttonMessageId,
}: MjImageComponentProps) {
  const {
    state: { user, isPaidUser, selectedConversation, conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const upscaleImage = async () => {
    if (!user) return;
    const response = await fetch('api/mj-image-upscale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-token': user?.token || '',
      },
      body: JSON.stringify({
        button: buttons[0],
        buttonMessageId,
      }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  };

  const [isUpscaled, setIsUpscaled] = useState(false);

  const { data, isLoading, error } = useQuery('upscale-image', upscaleImage, {
    enabled: isUpscaled,
  });
  const upscaleImageButtonOnClick = async () => {
    setIsUpscaled(true);
  };
  useEffect(() => {
    console.log({
      data,
    });
  }, [data]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      onClick={upscaleImageButtonOnClick}
      src={src}
      alt=""
      className={`${
        user ? 'hover:scale-125' : ''
      } w-full m-0 transition-all duration-500 cursor-pointer hover:drop-shadow-lg`}
      data-ai-image-selection={JSON.stringify(buttons)}
      data-ai-image-message-id={buttonMessageId}
    />
  );
}
