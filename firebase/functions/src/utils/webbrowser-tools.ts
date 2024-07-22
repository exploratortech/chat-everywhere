import html2md from 'html-to-md';
import { sanitize } from 'isomorphic-dompurify';
import { Page } from 'playwright-core';

export async function getMDContentOfArticle(page: Page): Promise<string> {
  const content = await getContentOfArticle(page);
  const mdContent = html2md(content);

  let filterMd = '';
  // filter out the html tags from the content
  const htmlTagPattern = /<[^>]*>/g;
  filterMd = mdContent.replace(htmlTagPattern, '');

  // filter out image links from the content
  const imageLinkPattern = /!\[[^\]]*\]\([^)]*\)/g;
  filterMd = filterMd.replace(imageLinkPattern, '');

  // filter out bold text from the content or italic text from the content
  const boldTextPattern = /\*\*([^*]+)\*\*/g;
  filterMd = filterMd.replace(boldTextPattern, '$1');

  console.log(filterMd);
  return filterMd;
}

async function getContentOfArticle(page: Page) {
  // wait for 2 seconds to make sure the page is fully loaded
  await page.waitForTimeout(2000);
  const articleHTML = await page.evaluate(() => {
    function getContainer() {
      const numWordsOnPage = document.body.innerText.match(/\S+/g)?.length ?? 0;
      let ps = document.body.querySelectorAll('p');

      // Find the paragraphs with the most words in it
      let pWithMostWords = document.body;
      let highestWordCount = 0;

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

      let selectedContainer: HTMLElement | null = pWithMostWords;
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

      return selectedContainer;
    }
    const pageSelectedContainer = getContainer();

    if (!pageSelectedContainer) {
      throw new Error('Page selected container is null');
    }

    return pageSelectedContainer.innerHTML;
  });

  // console.log("========articleHTML start ==========");
  // console.log(articleHTML);
  // console.log("========articleHTML end ==========");
  // console.log("========  sanitizeHtml articleHTML start ==========");
  // console.log(sanitizeHtml(articleHTML));
  // console.log("========  sanitizeHtml articleHTML end ==========");
  return sanitizeHtml(articleHTML);
}

function sanitizeHtml(html: string) {
  let newHtml;
  const pattern1 = /<a\b[^>]*>(.*?)<\/a>/gi;
  newHtml = sanitize(html.replace(pattern1, ''));
  const pattern2 = new RegExp('<br/?>[ \r\ns]*<br/?>', 'g');
  newHtml = sanitize(newHtml.replace(pattern2, '</p><p>'));

  return sanitize(newHtml);
}
