import { NextApiRequest, NextApiResponse } from 'next';

import { getMDContentOfArticle } from '@/utils/server/webbrowser-tools';

import playwright from 'playwright';

const prompt =
  'You are acting as a summarization AI, and for the input text please summarize it to the most important 3 to 5 bullet points for brevity: ';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { browserQuery } = req.query;
  const url = browserQuery as string;
  // Launch a new browser and open a new page
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the url
    await page.goto(url);

    const content = await getMDContentOfArticle(page);

    // Close the page and the browser
    await page.close();
    await browser.close();

    res.status(200).json({
      content,
    });
  } catch (error) {
    console.error(error);
    // Close the page and the browser in case of an error
    await page.close();
    await browser.close();
    res.status(500).json({ error });
  }
}
