import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useTeacherTags from '@/hooks/useTeacherTags';

import Spinner from '../Spinner';
import { Button } from '../ui/button';
import NewTagButton from './Tags/NewTagButton';
import Tag from './Tags/Tag';

const Tags = () => {
  const { t } = useTranslation('model');
  const { fetchQuery, removeTeacherTags, addTeacherTag } = useTeacherTags();
  const { data, isLoading } = fetchQuery;
  const { mutate: removeTags } = removeTeacherTags;
  const { mutate: addTag } = addTeacherTag;
  const tags = data?.tags || [];
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  return (
    <div className="">
      <h1 className="font-bold mb-4">{t('Tags')}</h1>
      <div className="flex gap-4 flex-wrap min-h-[10rem] content-start">
        {isLoading ? (
          <div className="flex mt-[50%]">
            <Spinner size="16px" className="mx-auto" />
          </div>
        ) : (
          tags.map((tag) => (
            <Tag
              key={tag.id}
              label={tag.name}
              count={2}
              onSelect={() => {
                if (selectedTags.includes(tag.id)) {
                  setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                } else {
                  setSelectedTags([...selectedTags, tag.id]);
                }
              }}
              selected={selectedTags.includes(tag.id)}
            />
          ))
        )}
      </div>
      <div className="flex items-center">
        <NewTagButton
          onAddTag={(tag_name) => {
            addTag(tag_name);
          }}
        />
        <Button
          onClick={() => {
            removeTags(selectedTags);
          }}
          variant={selectedTags.length === 0 ? 'outline' : 'destructive'}
          disabled={selectedTags.length === 0}
          className="transition-[background]"
        >
          Remove
        </Button>
      </div>
    </div>
  );
};

export default Tags;
