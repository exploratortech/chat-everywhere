import * as logger from "firebase-functions/logger";
import {getMDContentOfArticle} from "./utils/webbrowser-tools";
import {chromium} from "playwright-core";
import bundledChromium from "chrome-aws-lambda";
import * as functions from "firebase-functions";


export const webContent = functions.runWith({
  minInstances: 1,
  memory: "1GB",
}).region("asia-east1").https.onRequest(async (request, response) => {
  logger.info("webContent logs!", {structuredData: true});

  // get request
  const {url} = request.query;
  if (!url || typeof url !== "string" ) {
    response.status(400).json({
      error: "url is required",
    });
    return;
  }
  // Launch a new browser and open a new page
  if (process.env.FUNCTIONS_EMULATOR) {
    console.log("Running function locally.");
  } else {
    console.log("Running function on Firebase.");
  }
  const browser = await (async () => {
    if (process.env.FUNCTIONS_EMULATOR) {
      return chromium.launch({});
    } else {
      const executablePath = await Promise.resolve(bundledChromium.executablePath);
      return chromium.launch({executablePath});
    }
  })();
  console.log("Starting browser...");
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the url
    console.log(`Going to url (${url})...`);

    await page.goto(url);

    console.log("Converting content...");
    const content = await getMDContentOfArticle(page);

    // Close the page and the browser
    await page.close();
    console.log("Closing browser...");
    await browser.close();
    console.log("Done!");

    response.json({content});
  } catch (error) {
    console.error(error);
    // Close the page and the browser in case of an error
    await page.close();
    await browser.close();
    response.status(500).json({error});
  }
});

