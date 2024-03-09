import { NextApiRequest, NextApiResponse } from 'next';
import { i18n } from 'next-i18next';

import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const i18nServerInstance = i18next.createInstance();
  await i18nServerInstance.use(Backend).init({
    ns: ['aiPainter'],
    backend: {
      loadPath: 'public/locales/{{lng}}/{{ns}}.json',
    },
    lng: 'zh-Hant',
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development' ? true : false,
    defaultNS: 'aiPainter',
  });

  res.status(200).json({
    a: i18nServerInstance?.t('you are a good boy'),
    b: i18nServerInstance?.t('Creating artwork...🎨'),
  });
}
