import dotenv from 'dotenv'
import { Session } from "@inrupt/solid-client-authn-node";
import parseUrl from '../src/utils/urlParser.js';
import { readFile } from 'fs/promises';
const default_acl = "../src/acls/.acl"

export class SolidOperations {
    constructor(options) {
        console.log("envFile: ", options.envFile)
        dotenv.config({ path: options.envFile })
        this.session = new Session();

    }

    async init() {
        await this.session.login({
            oidcIssuer: process.env.OPENID_PROVIDER,
            clientId: process.env.TOKEN_IDENTIFIER,
            clientSecret: process.env.TOKEN_SECRET,
        });
        this.pod = parseUrl(this.session.info.webId)
        return this.session
    }

    async mkdir(path) {
        var parts = path.split('/');
        var slug = parts.pop() || parts.pop();
        let post_folder = await this.session.fetch(path, {
            method: 'PUT',
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
            'Slug': slug
        }
        )
        console.log(post_folder.status, "[post_folder]", path)
        await this.setAcl(path)
        return post_folder
    }

    async setAcl(path, acl_string) {
        if (acl_string == undefined) {
            acl_string = await readFile(default_acl);
        }
        let put_acl = await this.session.fetch(path + ".acl", {
            method: 'PUT',
            headers: { 'content-type': 'text/turtle' },
            body: acl_string
        })
        console.log(put_acl.status, "[put_acl]", path + ".acl")
    }

}