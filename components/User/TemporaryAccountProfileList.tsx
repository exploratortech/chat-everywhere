import { useTranslation } from 'react-i18next';

import { TempAccountProfiles } from '@/types/one-time-code';

import dayjs from 'dayjs';

const TemporaryAccountProfileList = ({
  tempAccountProfiles,
}: {
  tempAccountProfiles: TempAccountProfiles[];
}) => {
  const { t } = useTranslation('model');
  return (
    <div className="my-4">
      <h2 className="text-lg font-bold mb-4">
        {t('Account that used the code')}
      </h2>
      <table className="table-fixed w-full">
        <thead>
          <tr>
            <th>Unique ID</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {tempAccountProfiles.map((profile) => (
            <tr key={`temp-account-${profile.id}`}>
              <td>{profile.uniqueId}</td>
              <td>{dayjs(profile.created_at).format('YYYY-MM-DD HH:mm')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      ​
    </div>
  );
};

export default TemporaryAccountProfileList;
