import markdownToTxt from 'markdown-to-txt';

export const saveOutputLanguage = (lang: string) => {
  if (!lang || lang === 'default') {
    localStorage.setItem('outputLanguage', '');
    return;
  }
  localStorage.setItem('outputLanguage', lang);
};

export const convertMarkdownToText = (markdown: string): string =>
  markdownToTxt(markdown);
