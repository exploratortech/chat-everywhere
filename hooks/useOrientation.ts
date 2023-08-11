import { useEffect, useState } from 'react';

const useOrientation = (): boolean | null => {
  const [landscape, setLandscape] = useState<boolean | null>(null);

  useEffect(() => {
    const calculateOrientation = (): void => {
      setLandscape(
        typeof window !== 'undefined' && Math.abs(window.orientation) === 90,
      );
    };
    if (typeof window !== 'undefined') {
      calculateOrientation();
      window.addEventListener('orientationchange', calculateOrientation);

      return () => {
        window.removeEventListener('orientationchange', calculateOrientation);
      };
    }
  }, []);

  return landscape;
};
export default useOrientation;
