import { useTranslation } from 'react-i18next';

import { StudentMessageSubmission } from '@/types/share-messages-by-teacher-profile';

import AssistantRespondMessage from '@/components/Chat/ChatMessage/AssistantRespondMessage';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import dayjs from 'dayjs';

const SharedMessageItem = ({
  submission,
  className = '',
}: {
  submission: StudentMessageSubmission;
  className?: string;
}) => {
  const { t } = useTranslation('model');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={`bg-neutral-800 cursor-pointer max-w-[300px] max-h-[250px] w-[300px] h-[250px] overflow-hidden text-neutral-200 p-4 rounded-lg shadow-md ${className}`}
        >
          <div className="font-bold">
            {submission.temporary_account_profiles.uniqueId}
          </div>
          <div className="text-sm text-neutral-400">
            {t('Submitted at {{date}}', {
              date: dayjs(submission.created_at).format('YYYY-MM-DD HH:mm'),
            })}
          </div>
          <div className="mt-4">
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
      </DialogTrigger>
      <DialogContent className="border-0 w-full max-w-3xl tablet:max-w-max h-max transform overflow-hidden rounded-2xl text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 grid grid-rows-[max-content_1fr] mobile:h-[100dvh] mobile:!max-w-[unset] mobile:!rounded-none">
        <div className={`bg-neutral-800 text-neutral-200 p-4 rounded-lg`}>
          <div className="font-bold">
            {submission.temporary_account_profiles.uniqueId}
          </div>
          <div className="text-sm text-neutral-400">
            {t('Submitted at {{date}}', {
              date: dayjs(submission.created_at).format('YYYY-MM-DD HH:mm'),
            })}
          </div>
          <div className="mt-4">
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
      </DialogContent>
    </Dialog>
  );
};

export default SharedMessageItem;
