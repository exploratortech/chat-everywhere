function getAvailableLocales() {
  return [
    { name: 'English', value: 'en' },
    { name: '繁體中文', value: 'zh-Hant' },
    { name: '简体中文', value: 'zh-Hans' },
    { name: 'বাংলা', value: 'bn' },
    { name: 'Deutsch', value: 'de' },
    { name: 'Español', value: 'es' },
    { name: 'Français', value: 'fr' },
    { name: 'עברית', value: 'he' },
    { name: 'Bahasa Indonesia', value: 'id' },
    { name: 'Italiano', value: 'it' },
    { name: '日本語', value: 'ja' },
    { name: '한국어', value: 'ko' },
    { name: 'Polski', value: 'pl' },
    { name: 'Português', value: 'pt' },
    { name: 'Русский', value: 'ru' },
    { name: 'Română', value: 'ro' },
    { name: 'Svenska', value: 'sv' },
    { name: 'తెలుగు', value: 'te' },
    { name: 'Tiếng Việt', value: 'vi' },
    { name: 'العربية', value: 'ar' },
    { name: 'हिंदी', value: 'hi' },
  ];
}

// https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=stt#supported-languages
function getAvailableSpeechSourceLanguages() {
  return [
    { name: 'English', value: 'en-US' },
    { name: '國語(簡体)', value: 'zh-CN' },
    { name: '國語(繁體)', value: 'zh-TW' },
    { name: '廣東話', value: 'zh-HK' },
    { name: 'বাংলা', value: 'bn-IN' },
    { name: 'Deutsch', value: 'de-DE' },
    { name: 'Español', value: 'es-ES' },
    { name: 'Français', value: 'fr-FR' },
    { name: 'עברית', value: 'he-IL' },
    { name: 'Bahasa Indonesia', value: 'id-ID' },
    { name: 'Italiano', value: 'it-IT' },
    { name: '日本語', value: 'ja-JP' },
    { name: '한국어', value: 'ko-KR' },
    { name: 'Polski', value: 'pl-PL' },
    { name: 'Português', value: 'pt-PT' },
    { name: 'Русский', value: 'ru-RU' },
    { name: 'Română', value: 'ro-RO' },
    { name: 'Svenska', value: 'sv-SE' },
    { name: 'తెలుగు', value: 'te-IN' },
    { name: 'Tiếng Việt', value: 'vi-VN' },
    { name: 'العربية', value: 'ar-EG' },
    { name: 'हिंदी', value: 'hi-IN' },
  ];
}

const voiceMap: { [language: string]: string } = {
  'en-US': 'en-US-JennyNeural',
  'zh-CN': 'zh-CN-XiaoxiaoNeural',
  'zh-TW': 'zh-TW-HsiaoChenNeural',
  'zh-HK': 'zh-HK-HiuMaanNeural',
  'bn-IN': 'bn-IN-TanishaaNeural',
  'de-DE': 'de-DE-KatjaNeural',
  'es-ES': 'es-ES-ElviraNeural',
  'fr-FR': 'fr-FR-DeniseNeural',
  'he-IL': 'he-IL-HilaNeural',
  'id-ID': 'id-ID-GadisNeural',
  'it-IT': 'it-IT-ElsaNeural',
  'ja-JP': 'ja-JP-NanamiNeural',
  'ko-KR': 'ko-KR-SunHiNeural',
  'pl-PL': 'pl-PL-AgnieszkaNeural',
  'pt-PT': 'pt-PT-RaquelNeural',
  'ru-RU': 'ru-RU-SvetlanaNeural',
  'ro-RO': 'ro-RO-AlinaNeural',
  'sv-SE': 'sv-SE-SofieNeural',
  'te-IN': 'te-IN-ShrutiNeural',
  'vi-VN': 'vi-VN-HoaiMyNeural',
  'ar-EG': 'ar-EG-SalmaNeural',
  'hi-IN': 'hi-IN-SwaraNeural',
};

export {
  getAvailableLocales,
  getAvailableSpeechSourceLanguages,
  voiceMap,
};
