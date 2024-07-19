import type { MjButtonCommandRequest, MjImageGenRequest } from '@/types/mjJob';

export const executeNewImageGen = async (
  job: Omit<MjImageGenRequest, 'type'>,
  accessToken: string,
) => {
  const response = await fetch(`/api/mj-queue/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-token': accessToken,
    },
    body: JSON.stringify(job),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return await response.text();
};
export const executeButtonCommand = async (
  job: Omit<MjButtonCommandRequest, 'type'>,
  accessToken: string,
) => {
  const response = await fetch(`/api/mj-queue/initBtnCommand`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-token': accessToken,
    },
    body: JSON.stringify(job),
  });

  if (!response.ok) {
    console.log({
      text: await response.text(),
    });
    throw new Error('Network response was not ok');
  }
  return await response.text();
};
