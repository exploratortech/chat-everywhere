import React, { useState, Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../ui/button';
import { useTranslation } from 'react-i18next';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Input } from '@/components/ui/input';

const TitleEditorPopup = ({
  selectedMessageIds,
  setIsTitleEditorVisible,
  refetchTags
}: {
  selectedMessageIds: number[];
  setIsTitleEditorVisible: Dispatch<SetStateAction<boolean>>;
  refetchTags: () => void;
}) => {
  const { t } = useTranslation('model');
  const [newTitle, setNewTitle] = useState('');
  const supabase = useSupabaseClient();
  
  const handleSaveTitles = async () => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const data = {
      messageSubmissionIds: selectedMessageIds,
      title: newTitle,
    };
    try {
      const response = await fetch('/api/teacher-portal/edit-shared-message-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
        body: JSON.stringify(data),
      });
      const responseBody = await response.json();
      if (!response.ok || !responseBody.success) {
        toast.error(t('Failed to update titles'));
        return;
      }
      toast.success(t('Titles updated successfully'));
      refetchTags();
      setIsTitleEditorVisible(false);
    } catch (error) {
        toast.error('Failed to update Titles');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-2 items-center">
      <Input
        id="link"
        placeholder={t('Enter new title') as string}
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
      />
      </div>
      <Button
        variant={'ghost'}
        className="hover:bg-green-700"
        size={'lg'}
        onClick={handleSaveTitles}
      >
        {t('Save')}
      </Button>
    </div>
  );
};

export default TitleEditorPopup;