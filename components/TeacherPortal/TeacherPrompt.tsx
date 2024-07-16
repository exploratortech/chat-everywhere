import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import useTeacherPrompt from '@/hooks/teacherPortal/useTeacherPrompt';

import NewTeacherPromptButton from './TeacherPrompt/NewTeacherPromptButton';
import { TeacherPromptComponent } from './TeacherPrompt/TeacherPromptComponent';

const TeacherPrompt = () => {
  const { t } = useTranslation('model');
  const { fetchQuery, createMutation } = useTeacherPrompt();
  const { data: prompts } = fetchQuery;
  const { mutate: createPrompt } = createMutation;

  return (
    <div>
      <h1 className="mb-4 font-bold">{t('Teacher Prompt')}</h1>
      <div className="mb-8 flex flex-col content-start gap-4">
        {prompts &&
          prompts.map((prompt, index) => (
            <Fragment key={index}>
              <TeacherPromptComponent prompt={prompt} />
            </Fragment>
          ))}
      </div>
      <div>
        <NewTeacherPromptButton
          onCreatePrompt={(prompt) => createPrompt(prompt)}
        />
      </div>
    </div>
  );
};

export default TeacherPrompt;
