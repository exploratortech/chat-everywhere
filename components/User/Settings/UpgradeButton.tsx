import { useTranslation } from 'react-i18next';

interface UpgradeButtonProps {
  upgradeLinkOnClick: () => void;
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({
  upgradeLinkOnClick,
}) => {
  const { t } = useTranslation('model');
  return (
    <div className="flex flex-col">
      <a
        href="#" // Make sure to provide a valid href or handle the navigation in onClick
        target="_blank"
        rel="noreferrer"
        onClick={(e) => {
          e.preventDefault();
          upgradeLinkOnClick();
        }}
        className="px-4 py-2 border rounded-lg bg-white shadow border-none text-white font-semibold focus:outline-none mt-4 text-center text-sm cursor-pointer bg-gradient-to-r from-[#fd68a6] to-[#6c62f7]"
      >
        {t('Upgrade')}
      </a>
      <p className="text-xs text-neutral-400 mt-2">
        {t('No Strings Attached - Cancel Anytime!')}
      </p>
    </div>
  );
};

export default UpgradeButton;
