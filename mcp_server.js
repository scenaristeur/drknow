import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { Session } from "@inrupt/solid-client-authn-node";
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })
const session = new Session();
await session.login({
    oidcIssuer: process.env.OPENID_PROVIDER,
    clientId: process.env.TOKEN_IDENTIFIER,
    clientSecret: process.env.TOKEN_SECRET,
});

console.log(`You are now logged in as ${session.info.webId}`);
// console.log(session)

let res = await session.fetch("http://localhost:3000/david/profile/")
console.log(await res.text())

// Create an MCP server
const server = new McpServer({
    name: "demo-server",
    version: "1.0.0"
});


async function getData(url) {

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);
        return result
    } catch (error) {
        console.error(error.message);
        return error.message
    }
}

// Add an addition tool
server.registerTool("add",
    {
        title: "Addition Tool",
        description: "Add two numbers",
        inputSchema: { a: z.number(), b: z.number() }
    },
    async ({ a, b }) => ({
        content: [{ type: "text", text: String(a + b) }]
    })
);

server.registerTool("get_weather",
    {
        title: "get_weather",
        description: "Obtenir la météo actuelle pour une ville donnée",
        inputSchema: { city: z.string() }
        // inputSchema: {
        //     "type": "object",
        //     "properties": {
        //         "city": {
        //             "type": "string",
        //             "description": "Nom de la ville, ex: 'Paris'"
        //         }
        //     },
        //     "required": ["city"]
        // }
    },
    async ({ city }) => ({
        content: [{ type: "text", text: String(JSON.stringify({ "city": city, "temp_c": Math.floor(Math.random() * 40), "condition": "Ensoleillé" })) }]
    })
);

server.registerTool("list_solid_resources",
    {
        title: "list_solid_resources",
        description: "Lister les resources disponibles sur un serveur Solid",
        inputSchema: { path: z.string() }
        // inputSchema: {
        //     "type": "object",
        //     "properties": {
        //         "city": {
        //             "type": "string",
        //             "description": "Nom de la ville, ex: 'Paris'"
        //         }
        //     },
        //     "required": ["city"]
        // }
    },
    async ({ path }) => {
        let url = "http://localhost:3000/" + path + '/'
        let list_folder = await session.fetch(url, {
            method: 'GET',
            headers: { 'accept': 'application/json' }
        }
        )
        // console.log("post_result_json: ",post_result_json)
        let folder_list = await list_folder.json()
        console.log("ok list_folder: ", folder_list)


        let content = [{ type: "text", text: String(JSON.stringify({ folder_list: folder_list, url: url })) }]
        return { content: content }

    }
);

// Add a dynamic greeting resource
server.registerResource(
    "greeting",
    new ResourceTemplate("greeting://{name}", { list: undefined }),
    {
        title: "Greeting Resource",      // Display name for UI
        description: "Dynamic greeting generator"
    },
    async (uri, { name }) => ({
        contents: [{
            uri: uri.href,
            text: `Hello, ${name}!`
        }]
    })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);