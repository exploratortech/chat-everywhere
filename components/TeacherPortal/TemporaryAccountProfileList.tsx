import { useSupabaseClient } from '@supabase/auth-helpers-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from 'react-query';

import { trackEvent } from '@/utils/app/eventTracking';

import { TempAccountProfiles } from '@/types/one-time-code';

import { columns } from './TemporaryAccountProfileList/Columns';
import DataTable from './TemporaryAccountProfileList/DataTable';

const TemporaryAccountProfileList = ({
  tempAccountProfiles,
  maxQuota = 0,
  totalActiveTempAccount = 0,
}: {
  tempAccountProfiles: TempAccountProfiles[];
  maxQuota: number;
  totalActiveTempAccount: number;
}) => {
  const { t } = useTranslation('model');
  const queryClient = useQueryClient();

  const { mutate: removeTempAccount, isLoading } = useRemoveTempAccount();

  const handleRemove = (tempAccountIds: number[]) => {
    removeTempAccount(
      { tempAccountIds },
      {
        onSuccess: () => {
          toast.success(t('Temporary account removed'));
          queryClient.invalidateQueries(['getOneTimeCode']);
          trackEvent('Teacher portal remove temp account');
        },
        onError: (error) => {
          toast.error(t('Failed to remove temporary account'));
          console.error('Error removing temporary account:', error);
        },
      },
    );
  };

  return (
    <div className="my-4">
      <h2 className="text-lg font-bold mb-4">
        {t('Active accounts')}{' '}
        <label>{`(${totalActiveTempAccount}/${maxQuota})`}</label>
      </h2>
      <DataTable
        columns={columns}
        data={tempAccountProfiles}
        handleRemoveAccounts={handleRemove}
      />
    </div>
  );
};

export default TemporaryAccountProfileList;

function useRemoveTempAccount() {
  const supabase = useSupabaseClient();
  return useMutation(
    async ({ tempAccountIds }: { tempAccountIds: number[] }) => {
      const payload = {
        accessToken: (await supabase.auth.getSession()).data.session
          ?.access_token,
        tempAccountIds,
      };
      try {
        const response = await fetch(
          `/api/teacher-portal/remove-temp-accounts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        // Handle success response
        console.log('Successfully removed temporary account', data);
        return data;
      } catch (error) {
        // Handle error response
        console.error('Error removing temporary account:', error);
        throw error;
      }
    },
  );
}
