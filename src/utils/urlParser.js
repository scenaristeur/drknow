/**
 * Parses a URL and extracts the username and root path.
 * @param {string} url - The URL to parse.
 * @returns {Object} An object containing the username and root path.
 */
function parseUrl(url) {
    const parsedUrl = new URL(url);
    const pathnameParts = parsedUrl.pathname.split('/').filter(part => part !== '');

    if (pathnameParts.length < 2) {
        throw new Error('Invalid URL format');
    }
    const webId = url
    const user = pathnameParts[0];
    const server = `${parsedUrl.origin}/`
    const storage = `${parsedUrl.origin}/${user}/`;

    return {
        webId,
        server,
        user,
        storage
    };
}

export default parseUrl;
