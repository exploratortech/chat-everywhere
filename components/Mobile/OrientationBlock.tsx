import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import useDeviceDetect from '@/hooks/useDeviceDetect';
import useOrientation from '@/hooks/useOrientation';

interface OrientationBlockProps {
  children: ReactNode;
}

const OrientationBlock: React.FC<OrientationBlockProps> = ({ children }) => {
  const isLandscape = useOrientation();
  const deviceInfo = useDeviceDetect();
  const isMobileOrIOSAndNotTabletAndLandscape =
    deviceInfo.isMobile &&
    !deviceInfo.isTablet &&
    !deviceInfo.isDesktop &&
    isLandscape;

  const showBlocker = isMobileOrIOSAndNotTabletAndLandscape
    ? 'block'
    : 'hidden';
  const showContent = !isMobileOrIOSAndNotTabletAndLandscape
    ? 'block'
    : 'hidden';

  const { t } = useTranslation('common');
  return (
    <>
      <div
        className={`relative inset-0 h-dvh w-dvw bg-white px-4 py-8 text-center dark:bg-[#343541] dark:text-white ${showBlocker}`}
      >
        <h1 className="mb-4 text-2xl font-bold" suppressHydrationWarning>
          {t('We appreciate your use of our application.')}
        </h1>
        <p className="mb-4" suppressHydrationWarning>
          {t(
            'Currently, our app is optimized to work in portrait mode and unfortunately, we do not support landscape mode at this moment.',
          )}
        </p>
        <p suppressHydrationWarning>
          {t('Thank you for your understanding and patience.')}
        </p>
      </div>
      <div className={`${showContent}`}>{children}</div>
    </>
  );
};

export default OrientationBlock;
