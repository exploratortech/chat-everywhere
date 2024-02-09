import { useTranslation } from 'react-i18next';

import { TempAccountProfiles } from '@/types/one-time-code';

const TemporaryAccountProfileList = ({
  tempAccountProfiles,
}: {
  tempAccountProfiles: TempAccountProfiles[];
}) => {
  const { t } = useTranslation('model');
  return (
    <div className="my-4">
      <h2 className="text-lg font-bold">{t('Account that used the code')}</h2>
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
              <td>{profile.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
      ​
    </div>
  );
};

export default TemporaryAccountProfileList;
