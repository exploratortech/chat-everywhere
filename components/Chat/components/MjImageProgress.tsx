import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { useEffect } from 'react';

import Spinner from '@/components/Spinner/Spinner';

// THE COMPONENT IS USED FOR STATIC HTML GENERATION, SO DON'T USE HOOKS OR STATE

interface MjImageProgressProps {
  content: string;
  state: 'loading' | 'completed' | 'error';
}
export default function MjImageProgress({
  content,
  state,
}: MjImageProgressProps) {
  return (
    <div className="group relative my-4" tabIndex={0}>
      <label
        htmlFor="toggle-progress"
        className={`${state === 'loading' ? 'bg-white' : ''} ${
          state === 'completed' ? 'bg-green-200' : ''
        } ${
          state === 'error' ? 'bg-red-200' : ''
        } block text-black rounded-lg cursor-pointer`}
      >
        <div className="p-2 flex gap-2 items-center justify-between">
          <div className="flex gap-2 items-center font-bold">
            {state === 'loading' && <Spinner size="16px" />}
            {state === 'error' && <IconX size="16px" />}
            {state === 'completed' && <IconCheck size="16px" />}
            {state === 'loading' && 'Loading...'}
            {state !== 'loading' &&
              state.charAt(0).toUpperCase() + state.slice(1)}
          </div>

          {state !== 'loading' && (
            <>
              <IconArrowDown className="toggle-arrow-down h-3 group-focus:hidden" />
              <IconArrowUp className="toggle-arrow-up h-3 hidden group-focus:block" />
            </>
          )}
        </div>
        {state === 'loading' ? (
          <div className="panel p-2 max-h-full">{content}</div>
        ) : (
          <div className="panel group-focus:p-2 max-h-0 transition-all duration-200 overflow-hidden group-focus:max-h-full">
            {content}
          </div>
        )}
      </label>
    </div>
  );
}
