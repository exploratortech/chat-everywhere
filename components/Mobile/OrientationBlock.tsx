import { ReactNode } from 'react';

import useOrientation from '@/hooks/useOrientation';

interface OrientationBlockProps {
  children: ReactNode;
}

const OrientationBlock: React.FC<OrientationBlockProps> = ({ children }) => {
  const isLandscape = useOrientation();

  const showBlocker = isLandscape === true ? 'block' : 'hidden';
  const showContent = isLandscape === false ? 'block' : 'hidden';

  return (
    <>
      <div
        className={`relative inset-0 bg-white dark:bg-[#343541] dark:text-white w-[100dvw] h-[100dvh] text-center px-4 py-8 ${showBlocker}`}
      >
        <h1 className="text-2xl font-bold mb-4">
          We appreciate your use of our application.
        </h1>
        <p className="mb-4">
          Currently, our app is optimized to work in portrait mode and
          unfortunately, we do not support landscape mode at this moment.
        </p>
        <p>Thank you for your understanding and patience.</p>
      </div>
      <div className={`${showContent}`}>{children}</div>
    </>
  );
};

export default OrientationBlock;
