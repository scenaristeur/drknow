import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { Session } from "@inrupt/solid-client-authn-node";
import dotenv from 'dotenv'

import parseUrl from './src/utils/urlParser.js';
import { fetchOperation } from './src/utils/fetchOperations.js';


dotenv.config({ path: '.env' })
const session = new Session();
try {

    await session.login({
        oidcIssuer: process.env.OPENID_PROVIDER,
        clientId: process.env.TOKEN_IDENTIFIER,
        clientSecret: process.env.TOKEN_SECRET,
    });

    console.log(`You are now logged in as ${session.info.webId}`);
    // console.log(session)
    let webId = session.info.webId

    // let res = await session.fetch("http://localhost:3000/david/profile/")
    // console.log(await res.text())
    let pod = parseUrl(webId)
    console.log(pod)

} catch (e) {
    console.log("serveur Solid non disponible")
}


// Create an MCP server
const server = new McpServer({
    name: "demo-server",
    version: "1.0.0"
});


server.registerTool("get_weather",
    {
        title: "get_weather",
        description: "Obtenir la météo actuelle pour une ville donnée",
        inputSchema: { city: z.string() }
    },
    async ({ city }) => ({
        content: [{ type: "text", text: String(JSON.stringify({ "city": city, "temp_c": Math.floor(Math.random() * 40), "condition": "Ensoleillé" })) }]
    })
);

server.registerTool("get_folder",
    {
        title: "get_folder",
        description: "Lister le contenu d'un dossier en fournissant son url complete",
        inputSchema: { full_url: z.string() }
    },
    async ({ full_url }) => {
        // let url = "http://localhost:3000/" + path
        try {
            let list_folder = await session.fetch(full_url, {
                method: 'GET',
                headers: { 'accept': 'application/json' }
            }
            )
            // console.log("post_result_json: ",post_result_json)
            let folder_list = await list_folder.json()
            console.log("ok list_folder: ", folder_list)
            let short_folder_list = folder_list.map((f) => { return { "@id": f['@id'] } })
            console.log(short_folder_list)
            let content = [{ type: "text", text: String(JSON.stringify({ folder_content: short_folder_list, full_url: full_url })) }]
            return { content: content }
        }
        catch (e) {
            return { content: e }
        }
    }
);

server.registerTool("create_folder",
    {
        title: "Create Folder",
        description: "Creer un nouveau dossier {slug} dans le dossier {path} sur un serveur Solid, dans http://localhost:3000/{path}/{slug}/",
        inputSchema: { path: z.string(), slug: z.string() }
    },
    async ({ path, slug }) => {
        let url = "http://localhost:3000/" + path + '/'
        let headers = {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
            'Slug': slug
        };
        let result = await fetchOperation(session, 'PUT', url, null, headers);
        console.log("ok post_folder: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);