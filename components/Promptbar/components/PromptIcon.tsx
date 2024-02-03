import { IconBulb, IconBulbFilled } from '@tabler/icons-react';

import { Prompt } from '@/types/prompt';

const PromptIcon = ({
  prompt,
  size = 18,
}: {
  prompt: Prompt;
  size?: number;
}) => {
  return prompt.isCustomInstruction ? (
    <IconBulb color="#ffbf00" size={size} />
  ) : (
    <IconBulbFilled size={size} />
  );
};

export default PromptIcon;
