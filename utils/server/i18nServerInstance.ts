import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

const i18nServerInstance = i18next.createInstance();

// A function that initializes i18next and returns a promise
function initI18n() {
  return i18nServerInstance
    .use(Backend)
    .init({
      backend: {
        loadPath: './public/locales/{{lng}}/{{ns}}.json',
      },
      lng: 'en',
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development' ? true : false,
      defaultNS: 'common',
    })
    .then((r) => {
      console.log('!!! i18nServerInstance init success');
      return i18nServerInstance;
    });
}

export const i18nInitPromise = initI18n();

export async function i18nServerTranslate(
  key: string,
  ns: string,
  lng: string,
) {
  await i18nInitPromise;
  return i18nServerInstance.t(key, { ns: ns, lng: lng });
}
