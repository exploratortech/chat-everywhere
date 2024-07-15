import { IconBulb, IconBulbFilled } from '@tabler/icons-react';

import type { Prompt } from '@/types/prompt';

const PromptIcon = ({
  prompt,
  size = 18,
}: {
  prompt: Prompt;
  size?: number;
}) => {
  return prompt.isCustomInstruction ? (
    <IconBulb color="#5EC26A" size={size} />
  ) : (
    <IconBulbFilled size={size} />
  );
};

export default PromptIcon;
