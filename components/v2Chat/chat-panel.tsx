import { ButtonScrollToBottom } from '@/components/v2Chat/button-scroll-to-bottom';
import { PromptForm } from '@/components/v2Chat/prompt-form';

export interface ChatPanelProps {
  id?: string;
  isLoading: boolean;
  stop: () => void;
  append: (message: any) => Promise<void>;
  reload: () => void;
  input: string;
  setInput: (value: string) => void;
  messages: any[];
  startNewChat: () => void;
}

export function ChatPanel({
  id,
  isLoading,
  append,
  input,
  setInput,
  startNewChat,
}: ChatPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="h-24 space-y-4 border-t bg-white px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm
            onSubmit={async (value) => {
              await append({
                id,
                content: value,
                role: 'user',
              });
            }}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            startNewChat={startNewChat}
          />
        </div>
      </div>
    </div>
  );
}
