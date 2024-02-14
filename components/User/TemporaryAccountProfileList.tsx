import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { TempAccountProfiles } from '@/types/one-time-code';

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
      <table className="table-fixed w-full">
        <thead>
          <tr>
            <th>Unique ID</th>
            <th>Code Used</th>
            <th>Created At</th>
            <th>Expired At</th>
          </tr>
        </thead>
        <tbody>
          {tempAccountProfiles.map((profile) => (
            <tr key={`temp-account-${profile.id}`} className="text-sm">
              <td>{profile.uniqueId}</td>
              <td>
                <span
                  onClick={() => handleCopy(profile.code)}
                  className="cursor-pointer inline bg-sky-100 font-bold text-sm text-slate-900 font-mono rounded dark:bg-slate-600 dark:text-slate-200 text-primary-500 p-1"
                >
                  {profile.code}
                </span>
              </td>
              <td>{dayjs(profile.created_at).format('YYYY-MM-DD HH:mm')}</td>
              <td>
                <CodeTimeLeft endOfDay={profile.expired_at} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      ​
    </div>
  );
};

export default TemporaryAccountProfileList;
