import BasePage from './BasePage.js';

export default class ProfilePage extends BasePage {
    constructor(page) {
        super(page);
        this.bookSpans = this.page.locator('//div[@class="rt-tbody"]//span[contains(@id,"see-book-")]');
        this.userNameLabel = page.locator('#userName-value');
    }

    async getBookTitles() {
        await this.waitForElementVisible(this.userNameLabel);
        return await this.bookSpans.locator('a').allInnerTexts();
    }

    async reloadPage(){
        await this.page.reload();
    }
}
