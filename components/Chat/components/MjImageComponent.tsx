import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';

import HomeContext from '@/pages/api/home/home.context';

interface MjImageComponentProps {
  src: string;
  buttons: string[];
  buttonMessageId: string;
}
type Command = 'upscale' | '🔍 Zoom Out 2x' | '🔍 Zoom Out 1.5x';

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

  const availableCommands = useMemo(() => {
    let commands: Command[] = [];
    // if buttons list has a element with text like "U{number}" then it is a upscale command
    const upscaleCommand = buttons.find((button) => button.match(/^U\d+$/));
    const zoomOutCommands = buttons.filter((button) =>
      button.match(/^🔍 Zoom Out/),
    );
    if (upscaleCommand) {
      commands.push('upscale');
    }
    if (zoomOutCommands.length > 0) {
      commands.push(...(zoomOutCommands as Command[]));
    }

    return commands;
  }, [buttons]);

  const upscaleImageButtonOnClick = async () => {
    setIsUpscaled(true);
  };

  return (
    <div className="group">
      <div className={`group/image relative hover:z-10`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className={`${
            user ? `group-hover/image:scale-110` : ''
          } w-full m-0 transition-all duration-500 `}
          data-ai-image-selection={JSON.stringify(buttons)}
          data-ai-image-message-id={buttonMessageId}
        />
        <div
          className={`${
            user ? `group-hover/image:scale-110` : ''
          } group-hover/image:drop-shadow-lg group-hover/image:bg-black/75 transition-all duration-500 absolute top-0 left-0 w-full h-full`}
        >
          {/*  Button selections  */}
          <div className="hidden group-hover/image:flex flex-col justify-center items-center h-full">
            {availableCommands.map((command, index) => {
              return (
                <button
                  key={`${command}-${index}`}
                  className="cursor-pointer select-none border border-white text-white font-bold py-2 px-4"
                  onClick={upscaleImageButtonOnClick}
                >
                  {command}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
