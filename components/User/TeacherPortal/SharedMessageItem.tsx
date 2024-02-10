import { useTranslation } from 'react-i18next';

import { StudentMessageSubmission } from '@/types/share-messages-by-teacher-profile';

import AssistantRespondMessage from '@/components/Chat/ChatMessage/AssistantRespondMessage';

import dayjs from 'dayjs';

const SharedMessageItem = ({
  submission,
  className = '',
  onSelected,
}: {
  submission: StudentMessageSubmission;
  className?: string;
  onSelected?: (submission: StudentMessageSubmission) => void;
}) => {
  const { t } = useTranslation('model');
  return (
    <div
      className={`bg-neutral-800 text-neutral-200 p-4 rounded-lg shadow-md ${className}`}
      onClick={() => {
        if (onSelected) {
          onSelected(submission);
        }
      }}
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
  );
};

export default SharedMessageItem;
