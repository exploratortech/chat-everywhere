import { IconArrowUp, IconCheck, IconX } from '@tabler/icons-react';

import Spinner from '@/components/Spinner/Spinner';

// THE COMPONENT IS USED FOR STATIC HTML GENERATION, SO DON'T USE HOOKS OR STATE

export interface AiPainterProgressProps {
  content: string;
  state: 'loading' | 'completed' | 'error';
}
export default function AiPainterProgress({
  content,
  state,
}: AiPainterProgressProps) {
  return (
    <details
      className={`${state === 'loading' ? 'disabled bg-white' : ''} ${state === 'completed' ? 'bg-green-200' : ''} ${state === 'error' ? 'bg-red-200' : ''} relative my-4 block rounded-lg text-black`}
      open={state === 'loading' || state === 'error'}
    >
      <summary className="flex cursor-pointer items-center justify-between gap-2 p-2">
        <div className="flex grow items-center gap-2 font-bold">
          {state === 'loading' && <Spinner size="16px" />}
          {state === 'loading' && 'Loading...'}
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
        <div className="max-h-full p-2">{content}</div>
      </main>
    </details>
  );
}
