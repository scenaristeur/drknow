import { Session, EVENTS } from "@inrupt/solid-client-authn-node";
import dotenv from 'dotenv'

import parseUrl from './utils/urlParser.js';

dotenv.config({ path: '.env' })
const session = new Session();


export class SolidOperations {
    constructor() {

    }
    async init() {
        try {
            //session timeout expiration 5 min https://forum.solidproject.org/t/ess-timeout-after-5-minutes/6444/5
            session.events.on(EVENTS.SESSION_EXPIRATION, () => {
                session.login({
                    oidcIssuer: process.env.OPENID_PROVIDER,
                    clientId: process.env.TOKEN_IDENTIFIER,
                    clientSecret: process.env.TOKEN_SECRET,
                });
            });
            await session.login({
                oidcIssuer: process.env.OPENID_PROVIDER,
                clientId: process.env.TOKEN_IDENTIFIER,
                clientSecret: process.env.TOKEN_SECRET,
            });

            console.log(`You are now logged in as ${session.info.webId}`);
            console.log(session.info)
            let webId = session.info.webId

            // let res = await session.fetch("http://localhost:3000/david/profile/")
            // console.log(await res.text())
            let pod = parseUrl(webId)
            console.log(pod)

        } catch (e) {
            console.log("serveur Solid non disponible")
        }

    }

    async fetch({ url, method = "GET", headers, body }) {

        let options = {
            method: method,
            headers: headers,
        }
        if (body != undefined && body.length > 0) {
            options.body = body
        }
        console.log(options)
        try {
            let result = await session.fetch(url, options)
            // console.log(result)
            let message = {
                "status": result.status,
                "statusText": result.statusText,
                "ok": result.ok,
                "url": url,
                "options": options,
                "session": session.info
            }
            if (result.headers.get("location") != undefined) {
                message.location = result.headers.get("location")
            }

            if (headers.accept == 'application/json' ||
                headers.accept == 'application/ld+json' ||
                headers.Accept == 'application/json' ||
                headers.Accept == 'application/ld+json') {
                let body_json = await result.json()
                if (method == "GET" && url.endsWith('/')) {
                    // alléger la réponse liste  contenu d'un dossier 
                    let short_body_json = body_json.map((f) => {
                        if (f['@id'] != url) {
                            return { "@id": f['@id'] }
                        }
                    })
                    message.body = [...new Set(short_body_json.filter(n => n))]; //remove null & unique
                } else {
                    message.body = body_json
                }

            } else {
                message.body = await result.text()
            }
            // let content = [{ type: "text", text: String(JSON.stringify({ url: url })) }]
            let content = [{ type: "text", text: String(JSON.stringify(message)) }]
            return { content: content }
        } catch (e) {
            console.log(e, options)
            let content = [{
                type: "text", text: String(JSON.stringify({
                    "status": "ko",
                    "result": e, "url": url,
                    "options": options,
                    "session": session.info
                }))
            }]
            return { content: content }
        }
    }
}