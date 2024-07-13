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
    case "4":
      return "Red 21";
    case "29":
      return "Bright Pink 222";
    case "5":
      return "Dark Pink 221";
    case "26":
      return "Magenta 124";
    case "320":
      return "Dark Red 154";
    case "353":
      return "Coral 353";
    case "25":
      return "Orange 106";
    case "14":
      return "Yellow 24";
    case "19":
      return "Tan 5";
    case "78":
      return "Light Flesh 283";
    case "226":
      return "Bright Light Yellow 226";
    case "28":
      return "Dark Tan 138";
    case "297":
      return "Pearl Gold 297";
    case "191":
      return "Bright Light Orange 191";
    case "92":
      return "Flesh 18";
    case "2":
      return "Green 28";
    case "27":
      return "Lime 119";
    case "10":
      return "Bright Green 37";
    case "326":
      return "Yellowish Green 326";
    case "323":
      return "Light Aqua 323";
    case "322":
      return "Medium Azure 322";
    case "288":
      return "Dark Green 141";
    case "378":
      return "Sand Green 151";
    case "330":
      return "Olive Green 330";
    case "1":
      return "Blue 23";
    case "321":
      return "Dark Azure 321";
    case "73":
      return "Medium Blue 102";
    case "212":
      return "Bright Light Blue 212";
    case "379":
      return "Sand Blue 135";
    case "272":
      return "Dark Blue 140";
    case "85":
      return "Dark Purple 268";
    case "30":
      return "Medium Lavender 324";
    case "31":
      return "Lavender 325";
    case "71":
      return "Light Bluish Gray 194";
    case "72":
      return "Dark Bluish Gray 199";
    case "179":
      return "Flat Silver 315";
    case "0":
      return "Black 26";
    case "70":
      return "Reddish Brown 192";
    case "308":
      return "Dark Brown 308";
    case "484":
      return "Dark Orange 38";
    case "84":
      return "Medium Dark Flesh 312";
    case "15":
      return "White 1";
    case "36":
      return "Trans-Red 41";
    case "37":
      return "Trans Dark Pink 113";
    case "57":
      return "Trans-Orange 182";
    case "46":
      return "Trans Yellow 44";
    case "34":
      return "Trans Green 48";
    case "42":
      return "Trans Neon Green 49";
    case "33":
      return "Trans Dark Blue 43";
    case "43":
      return "Trans Medium Blue 42";
    case "52":
      return "Trans Purple 126";
    case "40":
      return "Trans Black 111";
    case "47":
      return "Trans-Clear 40";
    case "80":
      return "Light Silver Gray 315";
    default:
      return csvColor;
  }
};

const mapPartNumber = (partNumber) => {
  if (/.*[a-z]$/.test(partNumber)) {
    return partNumber.replace(/[a-zA-Z]/, "");
  }
  switch (partNumber) {
    case "44861":
      return "92280";
    case "42135":
      return "32039";
    case "42195":
      return "26287";
    case "44874":
      return "87082";
    case "65304":
      return "32054";
    case "65487":
      return "15100";
    default:
      return partNumber;
  }
};

(async () => {
  const startTime = Date.now();
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
  await page.setCookie(...cookies);
  page.setDefaultTimeout(3000);
  await page.goto(shopUrl);

  const missingParts = [];
  let counter = 0;
  for (const part of parts) {
    try {
      console.log(`${counter} / ${parts.length} finished`);
      counter++;
      const url = `${shopUrl}${shopUrlSearch}"${mapPartNumber(part.Part)}"${shopUrlParameters}`;
      const color = mapColor(part.Color);
      await page.goto(url);
      await page.waitForSelector(".card__hover-image", { timeout: 3_000 });
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
  console.log("### END OF MISSING PARTS ####");
  await browser.close();
  console.log(`Elapsed time: `, {
    elapsedSeconds: ((Date.now() - startTime) / 1000).toFixed(1),
  });
})();
