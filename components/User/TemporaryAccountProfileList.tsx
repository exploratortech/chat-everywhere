import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t('Copied to clipboard'));
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
            <TableHead>Unique ID</TableHead>
            <TableHead>Code Used</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Expired At</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TemporaryAccountProfileList;
