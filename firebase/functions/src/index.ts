import {getMDContentOfArticle} from "./utils/webbrowser-tools";

import bundledChromium from "chrome-aws-lambda";
import * as logger from "firebase-functions/logger";
import {Browser, chromium} from "playwright-core";
import {https} from "firebase-functions/v2";


let browser = null as null | Browser;
let browserTimeout = null as null | NodeJS.Timeout;
const envProjectId = JSON.parse(process.env.FIREBASE_CONFIG || "{}").projectId;

export const webContent = https.onRequest({
  minInstances: envProjectId === "chat-everywhere-api" ? 1 : 0,
  region: "asia-east1",
  memory: "1GiB",
  concurrency: 5,
}, async (request, response) => {
  logger.info("webContent logs!", {structuredData: true});

  // get request
  const {url} = request.query;
  if (!url || typeof url !== "string") {
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
  const hasBrowser = !!browser;
  if (!browser) {
    browser = await (async () => {
      if (process.env.FUNCTIONS_EMULATOR) {
        return chromium.launch({});
      } else {
        const executablePath = await Promise.resolve(
          bundledChromium.executablePath,
        );
        return chromium.launch({executablePath});
      }
    })();
    // Start the timer
    browserTimeout = setTimeout(async () => {
      if (browser) {
        await browser.close();
        browser = null;
      }
      browserTimeout = null;
    }, 300000); // 5 minutes = 300000
  }
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
    console.log("Done!");
    // Reset the timer
    if (browserTimeout) {
      clearTimeout(browserTimeout);
      browserTimeout = setTimeout(async () => {
        if (browser) {
          await browser.close();
          browser = null;
        }
        browserTimeout = null;
      }, 300000);
    }

    response.json({content, hasBrowser});
  } catch (error) {
    console.error(error);
    // Close the page and the browser in case of an error
    await page.close();
    await browser.close();
    response.status(500).json({error});
  }
});
