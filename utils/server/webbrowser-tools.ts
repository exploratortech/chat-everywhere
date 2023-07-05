import html2md from 'html-to-md';
import DOMPurify from 'isomorphic-dompurify';
import { Page } from 'playwright';

export async function getMDContentOfArticle(page: Page) {
  const content = await getContentOfArticle(page);
  const mdContent = html2md(content);
  return mdContent;
}
async function getContentOfArticle(page: Page) {
  const articleHTML = await page.evaluate(() => {
    function getContainer() {
      let selectedContainer;

      if (document.head.querySelector("meta[name='articleBody'")) {
        selectedContainer = document.createElement('div');
        selectedContainer.innerHTML = DOMPurify.sanitize(
          document.head
            .querySelector("meta[name='articleBody'")
            ?.getAttribute('content') ?? '',
        );
      } else {
        const numWordsOnPage =
          document.body.innerText.match(/\S+/g)?.length ?? 0;
        let ps = document.body.querySelectorAll('p');

        // Find the paragraphs with the most words in it
        let pWithMostWords = document.body,
          highestWordCount = 0;

        if (ps.length === 0) {
          ps = document.body.querySelectorAll('div');
        }

        ps.forEach((p) => {
          if (p.offsetHeight !== 0) {
            //  Make sure it's visible on the regular page
            const myInnerText = p.innerText.match(/\S+/g);
            if (myInnerText) {
              const wordCount = myInnerText.length;
              if (wordCount > highestWordCount) {
                highestWordCount = wordCount;
                pWithMostWords = p;
              }
            }
          }
        });

        // Keep selecting more generally until over 2/5th of the words on the page have been selected
        selectedContainer = pWithMostWords;
        let wordCountSelected = highestWordCount;

        while (
          wordCountSelected / numWordsOnPage < 0.4 &&
          selectedContainer != document.body &&
          selectedContainer.parentElement?.innerText
        ) {
          selectedContainer = selectedContainer.parentElement;
          wordCountSelected =
            selectedContainer.innerText.match(/\S+/g)?.length ?? 0;
        }

        // Make sure a single p tag is not selected
        if (selectedContainer.tagName === 'P') {
          selectedContainer = selectedContainer.parentElement;
        }
      }

      return selectedContainer;
    }
    let pageSelectedContainer = getContainer();

    if (!pageSelectedContainer) {
      throw new Error('Page selected container is null');
    }

    return pageSelectedContainer.innerHTML;
  });

  return sanitizeHtml(articleHTML);
}

function sanitizeHtml(html: string) {
  let newHtml;
  const pattern1 = /<a\b[^>]*>(.*?)<\/a>/gi;
  newHtml = DOMPurify.sanitize(html.replace(pattern1, ''));
  const pattern2 = new RegExp('<br/?>[ \r\ns]*<br/?>', 'g');
  newHtml = DOMPurify.sanitize(newHtml.replace(pattern2, '</p><p>'));

  return DOMPurify.sanitize(newHtml);
}
