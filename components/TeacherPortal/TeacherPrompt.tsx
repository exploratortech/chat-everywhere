import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import useTeacherPrompt from '@/hooks/useTeacherPrompt';

import { TeacherPromptComponent } from './TeacherPrompt/TeacherPromptComponent';

const TeacherPrompt = () => {
  const { t } = useTranslation('model');
  const { fetchQuery } = useTeacherPrompt();
  const { data: prompts } = fetchQuery;

  return (
    <div className="">
      <h1 className="font-bold mb-4">{t('Teacher Prompt')}</h1>
      <div className="flex flex-col gap-4 min-h-[10rem] content-start">
        {prompts &&
          prompts.map((prompt, index) => (
            <Fragment key={index}>
              <TeacherPromptComponent prompt={prompt} />
            </Fragment>
          ))}
      </div>
    </div>
  );
};

export default TeacherPrompt;
