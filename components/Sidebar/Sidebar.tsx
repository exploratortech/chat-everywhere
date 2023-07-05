import {
  IconFolderPlus,
  IconMistOff,
  IconPlus,
  IconRotateClockwise,
} from '@tabler/icons-react';
import { ReactNode, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { SidebarToggleButton } from './components/SidebarToggleButton';

import Search from '../Search';

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
  handleDrop: (e: any) => void;
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
  handleDrop,
  showMobileButton = true,
}: Props<T>) => {
  const { t } = useTranslation('promptbar');

  return (
    <div
      className={`
        ${ isOpen ? 'w-[260px]' : 'w-0' }
        ${ side === 'left' ? 'tablet:left-0' : 'tablet:right-0' }
        transition-all ease-linear relative h-full box-content bg-[#202123] tablet:fixed tablet:z-10
      `}
    >
      <div
        className={`
          ${ isOpen ? 'tablet:visible !bg-[#202123]/90' : '' }
          fixed invisible left-0 w-full h-full bg-transparent transition-all ease-linear -z-10
        `}
        onClick={toggleOpen}
      />
      <div
        className={`
          absolute block tablet:hidden z-50
          ${ side === 'left' ? 'right-0 translate-x-full' : 'left-0 -translate-x-full' }
        `}
      >
        <SidebarToggleButton
          onClick={toggleOpen}
          isOpen={isOpen}
        />
      </div>
      <div
        className={`
          ${ side === 'left' && !isOpen ? '-translate-x-full' : '' }
          ${ side === 'right' && !isOpen ? 'translate-x-full' : '' }
          z-10 top-0 ${side}-0 flex transition-all ease-linear w-[260px] h-full flex-none flex-col p-2 space-y-2 text-[14px]
        `}
      >
        <div className="flex items-center">
          <button
            className="text-sidebar flex w-[190px] flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-white/20 p-3 text-white transition-colors duration-200 hover:bg-gray-500/10"
            onClick={() => {
              handleCreateItem();
              handleSearchTerm('');
            }}
          >
            <IconPlus size={16} />
            {addItemButtonTitle}
          </button>

          <button
            className="ml-2 flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md border border-white/20 p-3 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10"
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

        <div className="flex-1 overflow-auto">
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
              <IconMistOff className="sm:hidden mx-auto mb-3" />
              <span className="text-[14px] leading-normal">
                {t('No prompts.')}
              </span>
            </div>
          )}
          <div
            className={`mt-2 transition-all duration-500 rounded-lg ${
              !itemsIsImporting && items?.length > 0
                ? 'visible opacity-100'
                : 'invisible opacity-0'
            }`}
          >
            {itemComponent}
          </div>
        </div>
        {footerComponent}
      </div>
    </div>
  );
};

export default Sidebar;
