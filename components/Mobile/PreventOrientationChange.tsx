import React, { FunctionComponent, ReactNode, useEffect } from 'react';

interface PreventOrientationChangeProps {
  children: ReactNode;
}

const PreventOrientationChange: FunctionComponent<
  PreventOrientationChangeProps
> = ({ children }) => {
  useEffect(() => {
    const handleOrientationChange = () => {
      switch (window.orientation) {
        case 90:
          document.body.className = 'rotation90';
          break;
        case -90:
          document.body.className = 'rotation-90';
          break;
        default:
          document.body.className = 'portrait';
          break;
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    handleOrientationChange();

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return <div>{children}</div>;
};

export default PreventOrientationChange;
