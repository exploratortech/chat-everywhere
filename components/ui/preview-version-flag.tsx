import { cn } from '../../lib/utils';

import { type ClassValue } from 'clsx';

const PreviewVersionFlag = ({ className = '' }: { className?: ClassValue }) => {
  return (
    <div
      className={cn(
        'bg-neutral-700 text-neutral-50 text-[10px] px-2 py-1 rounded-sm',
        className,
      )}
    >
      PREVIEW
    </div>
  );
};

export default PreviewVersionFlag;
