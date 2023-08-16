import { useEffect, useState } from 'react';

interface DeviceInfo {
  isAndroid: boolean;
  isIPad: boolean;
  isIOS: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isDesktop: boolean;
}

const useDeviceDetect = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isAndroid: false,
    isIPad: false,
    isIOS: false,
    isTablet: false,
    isMobile: false,
    isDesktop: false,
  });

  useEffect(() => {
    const agent = navigator.userAgent;
    const isAndroid = Boolean(agent.match(/Android/i));
    const isIPad = Boolean(agent.match(/iPad/i));
    const isIOS = Boolean(agent.match(/iPhone|iPad|iPod/i));
    const isMobile = Boolean(
      agent.match(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i,
      ),
    );
    const isTablet = isIPad || (isAndroid && window.outerWidth >= 768);
    const isDesktop = !isTablet && !isMobile;

    setDeviceInfo({
      isAndroid,
      isIPad,
      isIOS,
      isTablet,
      isMobile,
      isDesktop,
    });
  }, []);

  return deviceInfo;
};
export default useDeviceDetect;
