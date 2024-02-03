import { IconPlus } from '@tabler/icons-react';
import { FC, useContext } from 'react';

import { Conversation } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import { SidebarToggleButton } from '../Sidebar/components/SidebarToggleButton';

import CustomInstructionInUseIndicator from '../Chat/CustomInstructionInUseIndicator';
import { StoreConversationButton } from '../Spinner/StoreConversationButton';

interface Props {
  selectedConversation: Conversation;
  onNewConversation: () => void;
}

export const Navbar: FC<Props> = ({
  selectedConversation,
  onNewConversation,
}) => {
  const {
    state: { showChatbar, showPromptbar },
    toggleChatbar,
    togglePromptbar,
  } = useContext(HomeContext);

  return (
    <nav className="hidden tablet:flex w-full items-center bg-[#202123] py-3 px-4 gap-5">
      <SidebarToggleButton
        className="-ml-2"
        onClick={toggleChatbar}
        isOpen={showChatbar}
      />

      <div>
        {selectedConversation.name !== 'New conversation' && (
          <StoreConversationButton conversation={selectedConversation} />
        )}
      </div>

      <div className="flex-grow flex-shrink max-w-[240px] mx-auto text-center overflow-hidden text-ellipsis whitespace-nowrap">
        {selectedConversation.name !== 'New conversation' && (
          <div className="flex items-center justify-center gap-2">
            <CustomInstructionInUseIndicator />
            {selectedConversation.name}
          </div>
        )}
      </div>

      <div>
        <IconPlus
          className="cursor-pointer hover:text-neutral-400"
          onClick={onNewConversation}
        />
      </div>

      <SidebarToggleButton
        className="-mr-2"
        onClick={togglePromptbar}
        isOpen={showPromptbar}
      />
    </nav>
  );
};
