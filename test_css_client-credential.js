//code for the issue https://github.com/CommunitySolidServer/CommunitySolidServer/issues/2071

// All these examples assume the server is running at `http://localhost:3000/`.
import { Session } from "@inrupt/solid-client-authn-node";
const session = new Session();
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })


let webId = null
// @inrupt/solid-client-authn-node test with an Token created in CSS ui 
try {
    await session.login({
        oidcIssuer: process.env.OPENID_PROVIDER,
        clientId: process.env.TOKEN_IDENTIFIER,
        clientSecret: process.env.TOKEN_SECRET,
    });
    console.log(`You are now logged with @inrupt/solid-client-authn-node as ${session.info.webId}`);
    webId = session.info.webId
} catch (e) {
    console.log("serveur Solid non disponible")
}

console.log("My WebId", webId)

console.log("\n https://communitysolidserver.github.io/CommunitySolidServer/latest/usage/client-credentials/#generating-a-token \n")
// client-credential test https://communitysolidserver.github.io/CommunitySolidServer/latest/usage/client-credentials/#generating-a-token
// First we request the account API controls to find out where we can log in
const indexResponse = await fetch('http://localhost:3000/.account/');
let { controls } = await indexResponse.json();

// And then we log in to the account API
const response = await fetch(controls.password.login, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: process.env.EMAIL, password: process.env.PASSWORD }),
});
// This authorization value will be used to authenticate in the next step
const { authorization } = await response.json();
console.log("HERE is the authorisation", authorization)

// Now that we are logged in, we need to request the updated controls from the server.
// These will now have more values than in the previous example.
const indexResponse2 = await fetch('http://localhost:3000/.account/', {
    headers: { authorization: `CSS-Account-Token ${authorization}` }
});

let resp = await indexResponse2.json()
console.log("indexResponse2: ", resp)

let controls2 = resp.controls

// Here we request the server to generate a token on our account
const response2 = await fetch(controls2.account.clientCredentials, {
    method: 'POST',
    headers: { authorization: `CSS-Account-Token ${authorization}`, 'content-type': 'application/json' },
    // The name field will be used when generating the ID of your token.
    // The WebID field determines which WebID you will identify as when using the token.
    // Only WebIDs linked to your account can be used.
    body: JSON.stringify({ name: 'my-token', webId: webId }),
});

// These are the identifier and secret of your token.
// Store the secret somewhere safe as there is no way to request it again from the server!
// The `resource` value can be used to delete the token at a later point in time.
const { id, secret, resource } = await response2.json();

console.log(id, secret, resource)

import { createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';

// A key pair is needed for encryption.
// This function from `solid-client-authn` generates such a pair for you.
const dpopKey = await generateDpopKeyPair();

// These are the ID and secret generated in the previous step.
// Both the ID and the secret need to be form-encoded.
const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
// This URL can be found by looking at the "token_endpoint" field at
// http://localhost:3000/.well-known/openid-configuration
// if your server is hosted at http://localhost:3000/.
const tokenUrl = 'http://localhost:3000/.oidc/token';
const response3 = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
        // The header needs to be in base64 encoding.
        authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
        dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
    },
    body: 'grant_type=client_credentials&scope=webid',
});

// This is the Access token that will be used to do an authenticated request to the server.
// The JSON also contains an "expires_in" field in seconds,
// which you can use to know when you need request a new Access token.
const { access_token: accessToken } = await response3.json();

console.log(accessToken)

import { buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';

// The DPoP key needs to be the same key as the one used in the previous step.
// The Access token is the one generated in the previous step.
const authFetch = await buildAuthenticatedFetch(accessToken, { dpopKey });
// authFetch can now be used as a standard fetch function that will authenticate as your WebID.
// This request will do a simple GET for example.
const response4 = await authFetch(webId);

console.log(await response4.text())

console.log("ok")