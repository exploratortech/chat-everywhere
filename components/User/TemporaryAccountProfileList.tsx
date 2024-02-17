import { useSupabaseClient } from '@supabase/auth-helpers-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from 'react-query';
import { trackEvent } from '@/utils/app/eventTracking';

import { TempAccountProfiles } from '@/types/one-time-code';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import CodeTimeLeft from '../Referral/CodeTimeLeft';
import { Button } from '../ui/button';

import dayjs from 'dayjs';

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
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t('Copied to clipboard'));
  };

  const { mutate: removeTempAccount, isLoading } = useRemoveTempAccount();

  const handleRemove = (tempAccountId: string) => {
    removeTempAccount(
      { tempAccountId },
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
        {t('Active student account')}{' '}
        <label>{`(${totalActiveTempAccount}/${maxQuota})`}</label>
      </h2>
      <Table>
        <TableHeader>
          <TableRow className="border-[#4c4c4c]">
            <TableHead>{t('Unique ID')}</TableHead>
            <TableHead>{t('Code')}</TableHead>
            <TableHead>{t('Created At')}</TableHead>
            <TableHead>{t('Expired At')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tempAccountProfiles.map((profile) => (
            <TableRow
              key={`temp-account-${profile.id}`}
              className="text-sm border-[#4c4c4c]"
            >
              <TableCell>{profile.uniqueId}</TableCell>
              <TableCell>
                <span
                  onClick={() => handleCopy(profile.code)}
                  className="cursor-pointer inline bg-sky-100 font-bold text-sm text-slate-900 font-mono rounded dark:bg-slate-600 dark:text-slate-200 text-primary-500 p-1"
                >
                  {profile.code}
                </span>
              </TableCell>
              <TableCell>
                {dayjs(profile.created_at).format('YYYY-MM-DD HH:mm')}
              </TableCell>
              <TableCell>
                <CodeTimeLeft endOfDay={profile.expired_at} />
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  onClick={() => handleRemove(`${profile.id}`)}
                  disabled={isLoading}
                >
                  {t('Remove')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TemporaryAccountProfileList;

function useRemoveTempAccount() {
  const supabase = useSupabaseClient();
  return useMutation(async ({ tempAccountId }: { tempAccountId: string }) => {
    const payload = {
      accessToken: (await supabase.auth.getSession()).data.session
        ?.access_token,
      tempAccountId,
    };
    try {
      const response = await fetch(`/api/teacher-portal/remove-temp-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

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
  });
}
