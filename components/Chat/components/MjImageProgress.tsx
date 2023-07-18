import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

import Spinner from '@/components/Spinner/Spinner';

// THE COMPONENT IS USED FOR STATIC HTML GENERATION, SO DON'T USE HOOKS OR STATE
export default function MjImageProgress() {
  return (
    <div className="group relative" tabIndex={0}>
      <label
        htmlFor="toggle-progress"
        className="bg-gray-200 block text-black rounded-lg cursor-pointer"
      >
        <div className="p-2 flex gap-2 items-center justify-between">
          <div className="flex gap-2 items-center">
            <Spinner size="16px" />
            Loading...
          </div>

          <IconArrowDown className="toggle-arrow-down h-3 group-focus:hidden" />
          <IconArrowUp className="toggle-arrow-up h-3 hidden group-focus:block" />
        </div>
        <div className="panel group-focus:p-2 max-h-0 transition-all duration-500 ease-linear overflow-hidden group-focus:max-h-full">
          Yes! You can purchase a license that you can share with your entire
          team.
        </div>
      </label>
    </div>
  );
}
