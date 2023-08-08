import { useEffect, useState } from 'react';

const useOrientation = (): boolean | null => {
  const [landscape, setLandscape] = useState<boolean | null>(null);

  useEffect(() => {
    const calculateOrientation = (): void => {
      alert(
        `trigger calculateOrientation ${
          window.innerWidth > window.innerHeight
        } agent: ${navigator.userAgent}`,
      );
      setLandscape(
        typeof window !== 'undefined' && window.innerWidth > window.innerHeight,
      );
    };
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
