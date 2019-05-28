const puppeteer = require('puppeteer');

const getListContent = async (whishlist, domain) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://www.amazon.${domain}/hz/wishlist/ls/${whishlist}`);
    await page.waitFor(1000);

    await keepScrolling(page);

    const items = await page.evaluate(
      ({ whishlist }) => {
        const items = Array.from(document.querySelectorAll(`li[data-id="${whishlist}"]`));
        return items.map(item => {
          const titleEl = item.querySelector('h3.a-size-base');
          const params = JSON.parse(item.dataset.repositionActionParams).itemExternalId;
          const authorEl = item.querySelector('h3.a-size-base~span');
          const authorReg = authorEl
            ? authorEl.textContent.match(/(?<=by )(.*?)(?= \()/)
            : undefined;
          const imageEl = item.querySelector('.g-itemImage img');
          const starsEl = item.querySelector('span.a-icon-alt');
          const priceEl = item.querySelector('span.a-offscreen');
          const linkEl = item.querySelector('h3.a-size-base>a');

          return {
            title: titleEl ? titleEl.textContent : undefined,
            asin: params.match(/(?<=\:)(.*?)(?=\|)/)[0],
            author: authorReg ? authorReg[0] : undefined,
            image: imageEl ? imageEl.src : undefined,
            stars: starsEl ? starsEl.textContent : undefined,
            price: priceEl ? priceEl.textContent : undefined,
            link: linkEl ? linkEl.href : undefined
          };
        });
      },
      { whishlist }
    );
    await browser.close();
    return items;
  } catch (error) {
    return {
      error: `There has been an error while scraping the whishlist ${whishlist} on amazon.${domain}. Are you sure you entered the right whishlist and domain? Also make sure your wishilist is Public. Restart the script.`,
      fullMessage: error
    };
  }
};

const spinnerSelector = `document.querySelectorAll('.wl-see-more-spinner')`;
const keepScrolling = async page => {
  await page.evaluate(async () => {
    const items = Array.from(document.querySelectorAll('#g-items h3.a-size-base a.a-link-normal'));
    items.pop().scrollIntoView();
  });

  const hasSpinner = await page.evaluate(`${spinnerSelector}.length`);

  if (hasSpinner) {
    await page.waitForFunction(`${spinnerSelector}.length === 0`);
    await keepScrolling(page);
  }
};

module.exports = { getListContent };
