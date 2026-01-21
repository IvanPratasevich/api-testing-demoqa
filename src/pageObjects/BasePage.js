export default class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigateTo(url) {
    await this.page.goto(url, { waitUntil: 'load', timeout: 60000 });
  }

  async waitForElementVisible(locator) {
    await locator.waitFor({ state: 'visible' });
  }
}
