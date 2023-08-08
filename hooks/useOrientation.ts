import { useEffect, useState } from 'react';

const useOrientation = (): boolean | null => {
  const [landscape, setLandscape] = useState<boolean | null>(null);

  const calculateOrientation = (): void => {
    setLandscape(
      typeof window !== 'undefined' && window.innerWidth > window.innerHeight,
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      calculateOrientation();
      window.addEventListener('resize', calculateOrientation);

      return () => {
        window.removeEventListener('resize', calculateOrientation);
      };
    }
  }, []);

  return landscape;
};
export default useOrientation;
