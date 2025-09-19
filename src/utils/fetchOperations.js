import { Session } from "@inrupt/solid-client-authn-node";
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const session = new Session();

async function login() {
    await session.login({
        oidcIssuer: process.env.OPENID_PROVIDER,
        clientId: process.env.TOKEN_IDENTIFIER,
        clientSecret: process.env.TOKEN_SECRET,
    });
    console.log(`You are now logged in as ${session.info.webId}`);
}

async function logout() {
    await session.logout();
}

async function fetchOperation(method, url, data = null, contentType = 'text/plain', acceptType = null) {
    let headers = { 'Content-Type': contentType };
    if (acceptType) {
        headers['Accept'] = acceptType;
    }

    let options = { method, headers };

    if (data) {
        options.body = typeof data === 'string' ? data : JSON.stringify(data);
    }

    let response = await session.fetch(url, options);

    if (method === 'DELETE') {
        return await response.text();
    } else if (method === 'GET') {
        if (contentType.includes('json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    } else {
        return response.ok;
    }
}

export { login, logout, fetchOperation };
