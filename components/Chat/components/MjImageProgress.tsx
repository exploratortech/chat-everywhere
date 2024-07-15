import ProgressBar from '@ramonak/react-progress-bar';
import { IconArrowUp, IconCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import Spinner from '@/components/Spinner/Spinner';

export interface MjImageProgressProps {
  content: string;
  state: 'loading' | 'completed' | 'error';
  percentage?: `${number}`;
  errorMessage?: string;
}
export default function MjImageProgress({
  content,
  state,
  percentage,
  errorMessage,
}: MjImageProgressProps) {
  const { t } = useTranslation('common');
  const { t: chatT } = useTranslation('chat');
  return (
    <details
      className={`${state === 'loading' ? 'disabled bg-white' : ''} ${state === 'completed' ? 'bg-green-200' : ''} ${state === 'error' ? 'bg-red-200' : ''} relative my-4 block rounded-lg text-black`}
      open={state === 'loading' || state === 'error'}
    >
      <summary className="flex cursor-pointer items-center justify-between gap-2 p-2">
        <div className="flex grow items-center gap-2 font-bold">
          {state === 'loading' && <Spinner size="16px" />}

          {state === 'loading' && 'Loading...'}
          {state === 'loading' && percentage && (
            <ProgressBar
              completed={+percentage}
              className="basis-1/2"
              bgColor="#70cc60"
              height="15px"
              labelSize="12px"
            />
          )}

          {state === 'error' && <IconX size="16px" />}
          {state === 'completed' && <IconCheck size="16px" />}
          {state !== 'loading' &&
            state.charAt(0).toUpperCase() + state.slice(1)}
        </div>

        {state !== 'loading' && (
          <>
            <IconArrowUp className="toggle-arrow h-3" />
          </>
        )}
      </summary>
      <main>
        <div className="max-h-full whitespace-pre-line p-2">{content}</div>
        {errorMessage && (
          <div className="max-h-full whitespace-pre-line p-2">
            {`${t('Error')}: ${chatT(errorMessage)} `}
          </div>
        )}
      </main>
    </details>
  );
}
