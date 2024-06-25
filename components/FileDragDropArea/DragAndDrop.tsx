import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface DragAndDropProps {
  onFilesDrop: (files: File[]) => void;
}

const DragAndDrop: React.FC<DragAndDropProps> = ({ onFilesDrop }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslation('model');

  const handleDragEvent = useCallback(
    (e: React.DragEvent<HTMLDivElement>, isDragging: boolean) => {
      if (!e.dataTransfer.types.includes('Files')) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(isDragging);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      handleDragEvent(e, false);
      const files = Array.from(e.dataTransfer.files);
      onFilesDrop(files);
    },
    [handleDragEvent, onFilesDrop],
  );

  useEffect(() => {
    const handleGlobalDrag = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(
          e.type === 'dragenter' ||
            (e.type === 'dragleave' && !!e.relatedTarget),
        );
      }
    };

    document.addEventListener('dragenter', handleGlobalDrag);
    document.addEventListener('dragleave', handleGlobalDrag);

    return () => {
      document.removeEventListener('dragenter', handleGlobalDrag);
      document.removeEventListener('dragleave', handleGlobalDrag);
    };
  }, []);

  const dragProps = useMemo(
    () => ({
      onDragEnter: (e: React.DragEvent<HTMLDivElement>) =>
        handleDragEvent(e, true),
      onDragLeave: (e: React.DragEvent<HTMLDivElement>) =>
        handleDragEvent(e, false),
      onDragOver: (e: React.DragEvent<HTMLDivElement>) =>
        handleDragEvent(e, true),
      onDrop: handleDrop,
    }),
    [handleDragEvent, handleDrop],
  );

  if (!isDragging) return null;

  return (
    <div
      {...dragProps}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
    >
      <p className="text-2xl font-semibold text-white">
        {t('Drag files here')}
      </p>
    </div>
  );
};

export default DragAndDrop;
