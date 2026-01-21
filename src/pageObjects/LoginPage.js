import BasePage from './BasePage.js';

export default class LoginPage extends BasePage {
    constructor(page) {
        super(page);
        this.userNameInput = page.locator('#userName');
        this.passwordInput = page.locator('#password');
        this.loginBtn = page.locator('#login');
        this.userNameLabel = page.locator('#userName-value');
    }

    async fillUserName(lastName) {
        await this.waitForElementVisible(this.userNameInput);
        await this.userNameInput.fill(lastName);
    }

    async fillPassword(lastName) {
        await this.waitForElementVisible(this.passwordInput);
        await this.passwordInput.fill(lastName);
    }
    async clickLogin() {
        await this.loginBtn.waitFor({ state: 'visible' });
        await this.loginBtn.click();
    }

    async checkSuccessLogin(userName) {
        await this.waitForElementVisible(this.userNameLabel);
        return  this.userNameLabel.textContent();
    }

    async fillCompleteForm(userName, password) {
        await this.fillUserName(userName);
        await this.fillPassword(password);
        await this.clickLogin();
        await this.page.waitForURL('**/profile');
        await this.waitForElementVisible(this.userNameLabel);
    }
}