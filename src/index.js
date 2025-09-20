import parseUrl from './utils/urlParser.js';

export class Drknow { // <- module AND class code (public)
    constructor() {
        this.parseSampleUrl();
    }
    // private privateHello = 'hello'; // <- class code (private)
    // public publicHello = 'hello'; // <- class code (public)
    list() {
        console.log("list");
    }

    parseSampleUrl() {
        const url = 'http://localhost:3000/david/profile/card#me';
        try {
            const { user, rootPath } = parseUrl(url);
            console.log(`User: ${user}`);
            console.log(`Root Path: ${rootPath}`);
        } catch (error) {
            console.error(error.message);
        }
    }
}
