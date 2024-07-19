import {
  IconFolderPlus,
  IconMistOff,
  IconPlus,
  IconRotateClockwise,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { SidebarToggleButton } from './components/SidebarToggleButton';

import Search from '../Search';
import VoiceInputActiveOverlay from '../Voice/VoiceInputActiveOverlay';

interface Props<T> {
  isOpen: boolean;
  addItemButtonTitle: string;
  side: 'left' | 'right';
  items: T[];
  itemsIsImporting?: boolean;
  itemComponent: ReactNode;
  folderComponent: ReactNode;
  footerComponent?: ReactNode;
  searchTerm: string;
  handleSearchTerm: (searchTerm: string) => void;
  toggleOpen: () => void;
  handleCreateItem: () => void;
  handleCreateFolder: () => void;
  showMobileButton?: boolean;
}

const Sidebar = <T,>({
  isOpen,
  addItemButtonTitle,
  side,
  items,
  itemsIsImporting = false,
  itemComponent,
  folderComponent,
  footerComponent,
  searchTerm,
  handleSearchTerm,
  toggleOpen,
  handleCreateItem,
  handleCreateFolder,
}: Props<T>) => {
  const { t } = useTranslation('promptbar');

  return (
    <div
      className={`
        ${isOpen ? 'w-[260px]' : 'w-0'}
        ${side === 'left' ? 'tablet:left-0' : 'tablet:right-0'}
        relative box-content bg-[#202123] transition-all ease-linear tablet:fixed tablet:z-10 tablet:h-[calc(100%-48px)]
      `}
    >
      <div
        className={`
          ${isOpen ? '!bg-[#202123]/90 tablet:visible' : ''}
          invisible fixed left-0 -z-10 size-full bg-transparent transition-all ease-linear
        `}
        onClick={toggleOpen}
      />
      <div
        className={`
          absolute z-50 block tablet:hidden ${side === 'left' ? 'right-0 translate-x-full' : 'left-0 -translate-x-full'}
        `}
      >
        <SidebarToggleButton onClick={toggleOpen} isOpen={isOpen} />
      </div>
      <div
        className={`
          ${side === 'left' && !isOpen ? '-translate-x-full' : ''}
          ${side === 'right' && !isOpen ? 'translate-x-full' : ''}
          flex h-full w-[260px] flex-none flex-col space-y-2 p-2 text-[14px] transition-all ease-linear
        `}
      >
        <div className="flex items-center">
          <button
            className=" flex w-[190px] shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-white/20 p-3 text-white transition-colors duration-200 hover:bg-gray-500/10"
            onClick={() => {
              handleCreateItem();
              handleSearchTerm('');
            }}
          >
            <IconPlus size={16} />
            {addItemButtonTitle}
          </button>

          <button
            className="ml-2 flex shrink-0 cursor-pointer items-center gap-3 rounded-md border border-white/20 p-3 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10"
            onClick={handleCreateFolder}
          >
            <IconFolderPlus size={16} />
          </button>
        </div>
        <Search
          placeholder={t('Search prompts...') || ''}
          searchTerm={searchTerm}
          onSearch={handleSearchTerm}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex border-b border-white/20 pb-2">
            {folderComponent}
          </div>

          {itemsIsImporting && (
            <div className="mt-8 select-none text-center text-white opacity-50">
              <IconRotateClockwise className="mx-auto mb-3 animate-spin" />
              <span className="text-[14px] leading-normal">
                {t('Loading...')}
              </span>
            </div>
          )}

          {items?.length == 0 && (
            <div className="mt-8 select-none text-center text-white opacity-50">
              <IconMistOff className="mx-auto mb-3 sm:hidden" />
              <span className="text-[14px] leading-normal">
                {t('No prompts.')}
              </span>
            </div>
          )}
          <div
            className={`mt-2 rounded-lg transition-all duration-500 ${!itemsIsImporting && items?.length > 0 ? 'visible opacity-100' : 'invisible opacity-0'}`}
          >
            {itemComponent}
          </div>
        </div>
        {footerComponent}
      </div>
      <VoiceInputActiveOverlay />
    </div>
  );
};

export default Sidebar;
