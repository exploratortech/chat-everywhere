import { IconPlus } from '@tabler/icons-react';
import type { FC } from 'react';
import { useContext } from 'react';

import type { Conversation } from '@/types/chat';

import { SidebarToggleButton } from '../Sidebar/components/SidebarToggleButton';
import HomeContext from '@/components/home/home.context';

import CustomInstructionInUseIndicator from '../Chat/CustomInstructionInUseIndicator';
import ReportBugForTeacherStudentButton from '../Chat/ReportBugForTeacherStudentButton';
import { StoreConversationButton } from '../Spinner/StoreConversationButton';

interface Props {
  selectedConversation: Conversation;
  onNewConversation: (folderId?: string) => void;
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
    <nav className="hidden w-full items-center gap-5 bg-[#202123] px-4 py-3 tablet:flex">
      <SidebarToggleButton
        className="-ml-2"
        onClick={toggleChatbar}
        isOpen={showChatbar}
      />

      <div>
        {selectedConversation.name !== 'New conversation' && (
          <div className="flex items-center gap-2">
            <StoreConversationButton conversation={selectedConversation} />
            <ReportBugForTeacherStudentButton
              conversation={selectedConversation}
            />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[240px] shrink grow truncate text-center">
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
          onClick={() => onNewConversation()}
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
