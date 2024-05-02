import { useEffect, useState } from 'react';
import { Button } from '../../ui/button';
import { useTranslation } from 'react-i18next';
import { Tag } from '@/types/tags';
import { ShareMessagesByTeacherProfilePayload } from '@/types/share-messages-by-teacher-profile';

const Export = ({
  allSharedMessages,  
  selectedTags,
  selectedMessageIds,
} : {
  allSharedMessages: ShareMessagesByTeacherProfilePayload['submissions'] | null
  selectedTags: Tag[],
  selectedMessageIds: number[];
}) => {
  const { t } = useTranslation('model');
  const [selection, setSelection] = useState<string>('');

  useEffect(() => {
    if (selectedMessageIds.length > 0 ) {
        setSelection(selectedMessageIds.length.toString())
    } else if (selectedTags.length > 0) {
        setSelection('All in tags')
    } else {
        setSelection('All')
    }
  }, [selectedTags, selectedMessageIds])

  const exportSubmissionsAsHTML = () => {
    let filteredSubmissions;
    // Filter submissions based on selected message IDs or tags
    if (selectedMessageIds.length > 0) {
        // Filter by selected message IDs
        filteredSubmissions = allSharedMessages?.filter(submission =>
        selectedMessageIds.includes(submission.id)
        );
    } else if (selectedTags.length > 0) {
        // Filter by selected tags
        filteredSubmissions = allSharedMessages?.filter(submission =>
        submission.message_tags.some(tag =>
            selectedTags.map(t => t.id).includes(tag.id)
        )
        );
    } else {
        // If no message IDs or tags are selected, use all messages
        filteredSubmissions = allSharedMessages;
    }
    // Convert submissions to HTML
    const exportDate = new Date().toLocaleString();
    const exportSelection = selectedMessageIds.length > 0 ? `Selected Messages (${selectedMessageIds.length})` : selectedTags.length > 0 ? `All in Tags (${selectedTags.map(tag => tag.name).join(', ')})` : 'All Messages';
    const htmlContent = `
      <header>
        <h1>Export from Chat Everywhere (Teacher's portal)</h1>
        <p>Export Date: ${exportDate}</p>
        <p>Selection: ${exportSelection}</p>
      </header>
      <hr>
      ${filteredSubmissions?.map(submission => `
        <div>
          <h2>${submission.student_name}</h2>
          <p>Tags: ${submission.message_tags.map(tag => tag.name).join(', ')}</p>
          <p>${submission.message_content}</p>
          ${submission.image_file_url ? `<img src="${submission.image_file_url}" alt="Student work">` : ''}
          <hr>
        </div>
      `).join('')}
    `;

    // Create a new Blob with the HTML content
    const blob = new Blob([htmlContent || ''], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Create a link element, click it to initiate download, and then remove it from the DOM
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported_submissions.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Button
      variant={'secondary'}
      className="hover:bg-neutral-700"
      size={'lg'}
      onClick={exportSubmissionsAsHTML}
    >
      {t('Export')} ({selection})
    </Button>
  );
};

export default Export;