import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import useTeacherPortalLoading from '@/hooks/teacherPortal/useTeacherPortalLoading';

import { Input } from '@/components/ui/input';

interface NameEditProps {
  name: string;
  id: number;
}

function useOutsideClick(
  ref: React.RefObject<HTMLFormElement>,
  callback: () => void,
) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
}

const NameEdit: React.FC<NameEditProps> = ({ name, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentName, setCurrentName] = useState(name);
  const previousName = useRef(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useOutsideClick(formRef, () => setIsEditing(false));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };
  const { mutate: updateStudentName } = useUpdateStudentName();

  useEffect(() => {
    if (!isEditing && previousName.current !== currentName) {
      previousName.current = currentName;
      console.log(`calling api ${previousName.current}`);
      updateStudentName({ studentId: id, newName: currentName });
    }
  }, [isEditing, currentName, updateStudentName, id]);

  return (
    <div onClick={() => setIsEditing(true)}>
      {isEditing ? (
        <form ref={formRef} className="pl-2" onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="w-max"
          />
        </form>
      ) : (
        <div className="pl-5">{`${currentName}`}</div>
      )}
    </div>
  );
};

export default NameEdit;

const useUpdateStudentName = () => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const { t } = useTranslation('model');
  const { withLoading } = useTeacherPortalLoading();

  const updateStudentName = async ({
    studentId,
    newName,
  }: {
    studentId: number;
    newName: string;
  }) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    const response = await fetch('/api/teacher-portal/update-student-name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ studentId, newName }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update student name');
    }
    return await response.json();
  };

  return useMutation(
    ({ studentId, newName }: { studentId: number; newName: string }) =>
      withLoading(() => updateStudentName({ studentId, newName })),
    {
      onSuccess: () => {
        toast.success(t('Student name updated successfully'));
      },
      onError: (error: any) => {
        toast.error(t('Error updating student name'));
        console.error(error);
      },
    },
  );
};
