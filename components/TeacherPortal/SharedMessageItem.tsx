import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StudentMessageSubmission } from '@/types/share-messages-by-teacher-profile';

import AssistantRespondMessage from '@/components/Chat/ChatMessage/AssistantRespondMessage';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { Button } from '../ui/button';
import Tag from './Tags/Tag';

import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const SharedMessageItem = ({
  submission,
  className = '',
  onSelectMessage,
  isSelected,
}: {
  submission: StudentMessageSubmission;
  className?: string;
  onSelectMessage: (id: number) => void;
  isSelected?: boolean;
}) => {
  const { t } = useTranslation('model');
  const SubmissionContent = ({
    overflow,
    className = '',
  }: {
    overflow: boolean;
    className?: string;
  }) => (
    <div className={cn(className)}>
      <div className="font-bold">{submission.student_name}</div>
      <div className="flex gap-2 my-2 flex-wrap">
        {submission.message_tags.map((tag) => (
          <Tag key={tag.id} label={tag.name} />
        ))}
      </div>
      <div className="text-sm text-neutral-400">
        {t('Submitted at {{date}}', {
          date: dayjs(submission.created_at).format('YYYY-MM-DD HH:mm'),
        })}
      </div>
      <div
        className="mt-4"
        style={
          overflow ? { height: 'calc(95dvh - 10rem)', overflow: 'auto' } : {}
        }
      >
        {submission.message_content ? (
          <AssistantRespondMessage
            formattedMessage={submission.message_content}
            messageIndex={submission.id}
            messagePluginId={null}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={submission.image_file_url} alt="Shared content" />
        )}
      </div>
    </div>
  );

  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        onClick={() => onSelectMessage(submission.id)}
        className={cn(
          'group bg-neutral-800 relative cursor-pointer max-w-[300px] max-h-[250px] w-[300px] h-[250px] overflow-hidden text-neutral-200 p-4 rounded-lg shadow-md transition-all duration-100',
          className,
          isSelected ? 'border-4 border-white' : '',
        )}
      >
        <SubmissionContent
          overflow={false}
          className="group-hover:blur-[1px] pointer-events-none"
        />
        <div className="group-hover:visible invisible absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            {t('View full message')}
          </Button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-0 w-full max-w-3xl tablet:max-w-max h-max transform rounded-2xl text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 grid grid-rows-[max-content_1fr] mobile:h-[100dvh] max-h-[95dvh] mobile:!max-w-[unset] mobile:!rounded-none">
          <SubmissionContent overflow />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SharedMessageItem;
