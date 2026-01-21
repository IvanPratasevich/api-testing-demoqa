import { test, expect } from "@playwright/test";
import Fakerator from "fakerator";
import { LoginPage, ProfilePage } from "../src/pageObjects";
import AdBlock from "../src/utils/Adblock";

const fakerator = Fakerator("en-En");
const baseURL = "https://demoqa.com";

test("API Testing", async ({ page, request }) => {
    const userName = `User_${fakerator.names.firstName()}_${Date.now()}`;
    const password = `12345678Pa#`;
    let userID = "";
    let token = "";

    let allBooks = [];
    const isbns = ["9781449325862", "9781449337711", "9781449365035"];
    const [isbn1, isbn2, isbn3] = isbns;

    const loginPage = new LoginPage(page);
    const profilePage = new ProfilePage(page);

    await test.step("Should create new user", async () => {
        const response = await request.post(`${baseURL}/Account/v1/User`, {
            data: { userName, password },
        });
        console.log(password);
        const statusCode = response.status();
        expect(statusCode).toBe(201);
        const body = await response.json();
        userID = body.userID;
        console.log(body);
        expect(body).toHaveProperty("userID");
        expect(body).toHaveProperty("username", userName);
    });

    await test.step("Should authenticate user (generate token)", async () => {
        console.log(userID);
        const response = await request.post(`${baseURL}/Account/v1/GenerateToken`, {
            data: { userName, password },
        });
        const statusCode = response.status();
        expect(statusCode).toBe(200);
        const body = await response.json();
        console.log(body);
        expect(body).toHaveProperty("token");
        expect(body).toHaveProperty("status", "Success");
        expect(body).toHaveProperty("result", "User authorized successfully.");

        token = body.token;
    });

    await test.step("Should add books to users collection", async () => {
        console.log(userID);
        console.log(token);
        const response = await request.post(`${baseURL}/BookStore/v1/Books`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                userId: userID,
                collectionOfIsbns: [
                    {
                        isbn: isbn1,
                    },
                    {
                        isbn: isbn2,
                    },
                    {
                        isbn: isbn3,
                    },
                ],
            },
        });
        const statusCode = response.status();
        expect(statusCode).toBe(201);
        const body = await response.json();
        console.log(body);
        expect(body).toHaveProperty("books");
    });

    await test.step("Should get all books", async () => {
        const response = await request.get(`${baseURL}/BookStore/v1/Books`);
        const statusCode = response.status();
        expect(statusCode).toBe(200);
        const body = await response.json();
        expect(body.books.length).toBeGreaterThan(1);
        expect(body).toHaveProperty("books");

        for (const book of body.books) {
            allBooks.push(book);
        }
        console.log(allBooks);
    });

    await test.step("Should log in via UI", async () => {
        await AdBlock.blockAds(page);
        await loginPage.navigateTo(`${baseURL}/login`);
        await loginPage.fillCompleteForm(userName, password);
        const userNameValueUI = await loginPage.checkSuccessLogin(userName);
        expect(userNameValueUI).toBe(userName);
    });

    await test.step("Should validate collection via UI", async () => {
        await AdBlock.blockAds(page);
        await profilePage.navigateTo(`${baseURL}/profile`);
        const bookTitlesUI = await profilePage.getBookTitles();

        // find ISBNs (in all books from api) by titles from UI
        const isbnFromUI = [];

        for (const title of bookTitlesUI) {
            for (const book of allBooks) {
                if (book.title === title) {
                    isbnFromUI.push(book.isbn);
                    break;
                }
            }
        }
        console.log(isbnFromUI);

        // verify that isbn1, isbn2, isbn3 exist
        expect(isbnFromUI).toContain(isbn1);
        expect(isbnFromUI).toContain(isbn2);
        expect(isbnFromUI).toContain(isbn3);

        console.log(await profilePage.getBookTitles());
    });

    await test.step("Should delete one book via API", async () => {
        let response = await request.post(`${baseURL}/Account/v1/GenerateToken`, {
            data: { userName, password },
        });

        const body = await response.json();
        const newToken = body.token;
        token = newToken;

        response = await request.delete(`${baseURL}/BookStore/v1/Book`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            data: {
                userId: userID,
                isbn: isbn1,
            },
        });

        expect(response.status()).toBe(204);
        console.log(response.body);
    });

    await test.step("Should verify deletion via UI", async () => {
        const response = await request.post(`${baseURL}/Account/v1/GenerateToken`, {
            data: { userName, password },
        });

        const body = await response.json();
        const newToken = body.token;
        const newExpires = body.expires;

        // сonvert iso string to unix seconds
        const expiresUnix = Date.parse(newExpires) / 1000;

        const cookies = await page.context().cookies(baseURL);
        const tokenCookie = cookies.find((cookie) => cookie.name === "token");

        if (!tokenCookie) {
            throw new Error("Token cookie not found");
        }

        tokenCookie.value = newToken;
        tokenCookie.expires = expiresUnix;

        await page.context().addCookies([tokenCookie]);
        await profilePage.reloadPage();

        const bookTitlesUI = await profilePage.getBookTitles();

        const isbnFromUI = [];

        for (const title of bookTitlesUI) {
            for (const book of allBooks) {
                if (book.title === title) {
                    isbnFromUI.push(book.isbn);
                    break;
                }
            }
        }

        console.log(isbnFromUI);

        // verify that isbn1 do not exist
        expect(isbnFromUI).not.toContain(isbn1);
        expect(isbnFromUI).toContain(isbn2);
        expect(isbnFromUI).toContain(isbn3);
    });
});
