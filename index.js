"use strict";

const puppeteer = require("puppeteer-core");
const cookiesSecure = require("chrome-cookies-secure");

const {
  executablePath,
  defaultViewport,
  shopUrl,
  shopUrlSearch,
  shopUrlParameters,
} = require("./configuration/defaults");
const parts = require("./configuration/parts");
const chrome = require("chrome-cookies-secure");

const delay = (time) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
};

const getCookiesForPuppeteer = async (page) => {
  const cookies = await chrome.getCookiesPromised("https://www.yourwobb.com/");
  return Object.entries(cookies).map((cookie) => {
    return { name: cookie[0], value: cookie[1] };
  });
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport,
  });
  const context = browser.defaultBrowserContext();
  context.overridePermissions(shopUrl, ["notifications"]); // Avoid notifications alert
  const [page] = await browser.pages();
  page.setDefaultTimeout(3000);
  await page.goto(shopUrl);
  const cookies = await getCookiesForPuppeteer(page);
  await page.setCookie(...cookies);

  const missingParts = [];
  for (const part of parts.Parts) {
    try {
      const url = `${shopUrl}${shopUrlSearch}${part.Part}${shopUrlParameters}`;
      await page.goto(url);
      await page
        .locator(".card__hover-image")
        .filter((img) => img.alt.indexOf("GOBRICKS GDS") !== -1)
        .click();
      await page.locator(".product-info__add-to-cart").scroll();
      await delay(2000);
      await page.evaluate((part) => {
        return Array.from(document.querySelectorAll(".swatch--variant-image"))
          .filter((r) => r.innerText === part.Color)[0]
          .click();
      }, part);

      await page.evaluate((part) => {
        return Array.from(document.querySelectorAll(".swatch--variant-image"))
          .filter((r) => r.innerText === part.Color)[0]
          .click();
      }, part);
      await page.evaluate((part) => {
        document.querySelector('input[type="hidden"][name="quantity"]').value =
          Number.parseInt(part.Quantity);
      }, part);
      await page.locator(".product-info__add-button").click();
    } catch (error) {
      missingParts.push(part);
    }
  }
  console.log("### BEGIN OF MISSING PARTS ####");
  console.log(missingParts);
  console.log("### END OF MISSING PARTS ####");
  await browser.close();
})();
