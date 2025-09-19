import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { login, logout, fetchOperation } from './src/utils/fetchOperations.js';

// await login();

// console.log(`You are now logged in as ${session.info.webId}`);
// console.log(session)

// let res = await fetchOperation('GET', "http://localhost:3000/david/profile/");
// console.log(res);

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
        return result;
    } catch (error) {
        console.error(error.message);
        return error.message;
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
        let url = "http://localhost:3000/" + path + '/';
        let folder_list = await fetchOperation('GET', url, null, 'application/json');
        console.log("ok list_folder: ", folder_list);

        let content = [{ type: "text", text: String(JSON.stringify({ folder_list: folder_list, url: url })) }];
        return { content: content };
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

// Register post_folder tool
server.registerTool("post_folder",
    {
        title: "Post Folder",
        description: "Create a new folder on a Solid server",
        inputSchema: { url: z.string() }
    },
    async ({ url }) => {
        let headers = {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
            'Slug': 'logbook2'
        };
        let result = await fetchOperation('PUT', url, null, headers);
        console.log("ok post_folder: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register put_text tool
server.registerTool("put_text",
    {
        title: "Put Text",
        description: "Upload text data to a Solid server",
        inputSchema: { url: z.string(), data: z.string() }
    },
    async ({ url, data }) => {
        let result = await fetchOperation('PUT', url, data, 'text/plain');
        console.log("ok put_text: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register put_turtle tool
server.registerTool("put_turtle",
    {
        title: "Put Turtle",
        description: "Upload turtle data to a Solid server",
        inputSchema: { url: z.string(), data: z.string() }
    },
    async ({ url, data }) => {
        let result = await fetchOperation('PUT', url, data, 'text/turtle');
        console.log("ok put_turtle: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register put_json_ld tool
server.registerTool("put_json_ld",
    {
        title: "Put JSON-LD",
        description: "Upload JSON-LD data to a Solid server",
        inputSchema: { url: z.string(), data: z.any() }
    },
    async ({ url, data }) => {
        let result = await fetchOperation('PUT', url, data, 'application/json');
        console.log("ok put_json_ld: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register put_json tool
server.registerTool("put_json",
    {
        title: "Put JSON",
        description: "Upload JSON data to a Solid server",
        inputSchema: { url: z.string(), data: z.any() }
    },
    async ({ url, data }) => {
        let result = await fetchOperation('PUT', url, data, 'application/json');
        console.log("ok put_json: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register post_json tool
server.registerTool("post_json",
    {
        title: "Post JSON",
        description: "Post JSON data to a Solid server",
        inputSchema: { url: z.string(), data: z.any() }
    },
    async ({ url, data }) => {
        let result = await fetchOperation('POST', url, data, 'application/json');
        console.log("ok post_json: ", result);
        let location = result.headers.get("location");
        console.log("location: ", location);
        return { content: [{ type: "text", text: String(result) }, { type: "text", text: String(location) }] };
    }
);

// Register delete_file tool
server.registerTool("delete_file",
    {
        title: "Delete File",
        description: "Delete a file on a Solid server",
        inputSchema: { url: z.string() }
    },
    async ({ url }) => {
        let result = await fetchOperation('DELETE', url);
        console.log("ok delete_file: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register get_ttl tool
server.registerTool("get_ttl",
    {
        title: "Get TTL",
        description: "Get turtle data from a Solid server",
        inputSchema: { url: z.string() }
    },
    async ({ url }) => {
        let result = await fetchOperation('GET', url, null, 'text/turtle');
        console.log("ok get_ttl: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register patch_n3 tool
server.registerTool("patch_n3",
    {
        title: "Patch N3",
        description: "Patch turtle data on a Solid server using N3",
        inputSchema: { url: z.string(), data: z.string() }
    },
    async ({ url, data }) => {
        let result = await fetchOperation('PATCH', url, data, 'text/n3');
        console.log("ok patch_n3: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register sparql_update tool
server.registerTool("sparql_update",
    {
        title: "SPARQL Update",
        description: "Update turtle data on a Solid server using SPARQL",
        inputSchema: { url: z.string(), data: z.string() }
    },
    async ({ url, data }) => {
        let result = await fetchOperation('PATCH', url, data, 'application/sparql-update');
        console.log("ok sparql_update: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register get_ttl2 tool
server.registerTool("get_ttl2",
    {
        title: "Get TTL2",
        description: "Get turtle data from a Solid server",
        inputSchema: { url: z.string() }
    },
    async ({ url }) => {
        let result = await fetchOperation('GET', url, null, 'text/turtle');
        console.log("ok get_ttl2: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register get_ttl3 tool
server.registerTool("get_ttl3",
    {
        title: "Get TTL3",
        description: "Get turtle data from a Solid server",
        inputSchema: { url: z.string() }
    },
    async ({ url }) => {
        let result = await fetchOperation('GET', url, null, 'text/turtle');
        console.log("ok get_ttl3: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register get_ttl3_json tool
server.registerTool("get_ttl3_json",
    {
        title: "Get TTL3 JSON",
        description: "Get JSON data from a Solid server",
        inputSchema: { url: z.string() }
    },
    async ({ url }) => {
        let result = await fetchOperation('GET', url, null, 'application/json');
        console.log("ok get_ttl3_json: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

// Register list_folder tool
server.registerTool("list_folder",
    {
        title: "List Folder",
        description: "List resources in a folder on a Solid server",
        inputSchema: { url: z.string() }
    },
    async ({ url }) => {
        let result = await fetchOperation('GET', url, null, 'application/json');
        console.log("ok list_folder: ", result);
        return { content: [{ type: "text", text: String(result) }] };
    }
);

