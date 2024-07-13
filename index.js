"use strict";

const puppeteer = require("puppeteer-core");
const chrome = require("chrome-cookies-secure");
const csv = require("csvtojson/v2");

const {
  executablePath,
  defaultViewport,
  domain,
  shopUrl,
  shopUrlSearch,
  shopUrlParameters,
  csvFilePath,
} = require("./configuration/defaults");

const delay = (time) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
};

const getCookiesForPuppeteer = async () => {
  const cookies = await chrome.getCookiesPromised(shopUrl);
  return Object.entries(cookies).map((cookie) => {
    return { name: cookie[0], value: cookie[1], domain };
  });
};

const mapColor = (csvColor) => {
  switch (csvColor) {
    case "0":
      return "Black 26";
    case "14":
      return "Yellow 24";
    case "71":
      return "Light Bluish Gray 194";
    case "72":
      return "Dark Bluish Gray 199";
    case "1":
      return "Blue 23";
    case "4":
      return "Red 21";
    case "70":
      return "Reddish Brown 192";
    case "28":
      return "Dark Tan 138";
    case "19":
      return "Tan 5";
    case "182":
      return "Trans-Orange 182";
    case "47":
      return "Trans-Clear 40";
    case "80":
      return "Light Silver Gray 315";
    case "71":
      return "White 1";
    case "36":
      return "Trans-Red 41";
    default:
      return csvColor;
  }
};

(async () => {
  const parts = await csv().fromFile(csvFilePath);
  const cookies = await getCookiesForPuppeteer();
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
  await page.setCookie(...cookies);

  const missingParts = [];
  for (const part of parts) {
    try {
      const url = `${shopUrl}${shopUrlSearch}${part.Part}${shopUrlParameters}`;
      const color = mapColor(part.Color);
      await page.goto(url);
      await page
        .locator(".card__hover-image")
        .filter((img) => img.alt.indexOf("GOBRICKS GDS") !== -1)
        .click();
      await page.locator(".product-info__add-to-cart").scroll();
      await delay(2000);
      await page.evaluate((color) => {
        return Array.from(document.querySelectorAll(".swatch--variant-image"))
          .filter((r) => r.innerText === color)[0]
          .click();
      }, color);
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
  console.log(await page.cookies());
  console.log("### END OF MISSING PARTS ####");
  await browser.close();
})();
