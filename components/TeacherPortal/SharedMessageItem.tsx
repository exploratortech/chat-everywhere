import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { StudentMessageSubmission } from '@/types/share-messages-by-teacher-profile';

import AssistantRespondMessage from '@/components/Chat/ChatMessage/AssistantRespondMessage';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { Button } from '../ui/button';
import Tag from './Tags/Tag';

import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface ShareMessageItemProps {
  submission: StudentMessageSubmission;
  className?: string;
  onSelectMessage: (id: number, isShiftKey?: boolean) => void;
  isSelected?: boolean;
}
const SharedMessageItem = memo(
  ({
    submission,
    className = '',
    onSelectMessage,
    isSelected,
  }: ShareMessageItemProps) => {
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
        <div className="my-2 flex flex-wrap gap-2">
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
      <div className="w-full">
        <div
          onClick={(event) => onSelectMessage(submission.id, event?.shiftKey)}
          className={cn(
            'group bg-neutral-800 relative cursor-pointer w-[300px] mobile:w-full max-w-[300px] max-h-[250px] h-[250px] overflow-hidden text-neutral-200 p-4 rounded-lg shadow-md transition-all duration-100',
            className,
            isSelected ? 'border-4 border-white' : '',
          )}
        >
          <SubmissionContent
            overflow={false}
            className="pointer-events-none select-none group-hover:blur-[1px]"
          />
          <div className="invisible absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:visible">
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
          <DialogContent className="grid h-max max-h-[95dvh] w-full max-w-3xl grid-rows-[max-content_1fr] rounded-2xl border-0 bg-neutral-800 text-left align-middle text-neutral-200 shadow-xl transition-all mobile:h-dvh mobile:!max-w-[unset] mobile:!rounded-none tablet:min-w-max">
            <SubmissionContent overflow />
          </DialogContent>
        </Dialog>
      </div>
    );
  },
  propsAreEqual,
);
function propsAreEqual(
  prevProps: ShareMessageItemProps,
  nextProps: ShareMessageItemProps,
) {
  const equal =
    prevProps.submission.id === nextProps.submission.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.submission.message_tags === nextProps.submission.message_tags &&
    prevProps.submission.student_name === nextProps.submission.student_name;

  return equal;
}

SharedMessageItem.displayName = 'SharedMessageItem';

export default SharedMessageItem;
