import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';

const RelativeTimeComponent = ({ time }: { time: string }) => {
  const { i18n } = useTranslation();

  switch (i18n.language) {
    case 'zh-Hant':
    case 'zh':
      return <span>{dayjs(time).locale('zh-tw').fromNow()}</span>;
    case 'zh-Hans':
    case 'cn':
      return <span>{dayjs(time).locale('zh-cn').fromNow()}</span>;
    default:
      return <span>{dayjs(time).locale('en').fromNow()}</span>;
  }
};

export default RelativeTimeComponent;
