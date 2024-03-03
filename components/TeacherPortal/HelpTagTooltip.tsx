import { IconHelpCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const HelpTagTooltip = () => {
  const { t } = useTranslation('model');
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" className="w-[20px] h-[20px]">
            <IconHelpCircle size={20} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-[400px]">
            {t(
              'The tag links to the current one-time code for the student account. Updates to the tag affect new message submissions, while existing submissions remain unchanged.',
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HelpTagTooltip;
