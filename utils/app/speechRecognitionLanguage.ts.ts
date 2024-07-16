export const saveSpeechRecognitionLanguage = (lang: string) => {
  if (!lang) {
    localStorage.setItem('speechRecognitionLanguage', 'en-US');
    return;
  }
  localStorage.setItem('speechRecognitionLanguage', lang);
};
