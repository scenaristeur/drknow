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


server.registerTool("interacting_with_solid_server", {
    title: "Interacting with Solid server",
    description: `Outil CRUD générique pour lire, créer, supprimer, modifier des ressources sur un serveur Solid :
    la méthode PUT permet de creer des ressources à une url précise :
        - PUT pour créer un fichier texte : {
            {"url": "http://localhost:3000/myfile.txt",
            "method": 'PUT',
            "headers": { "content-type": "text/plain" },
            "body": "test de data 2"}
        - PUT pour créer un fichier turtle :
            {"url": "http://localhost:3000/myfile.ttl",
            "method": 'PUT',
            "headers": { "content-type": "text/turtle" },
            "body": "<ex:s> <ex:p> <ex:o>.\n<ex:s> <ex:p2> <ex:o2>."}
    la méthode POST permet de créer des ressources dans un dossier, son url est générée par le serveur et retourné dans la variable location
        - POST :
            {"url": "http://localhost:3000/myfolder/",
            "method": 'POST',
            "headers": { "content-type": "text/turtle" },
            "body": "<ex:s> <ex:p> <ex:o>."}
    la méthode GET pour lire les ressources : 
        - GET pour lire un fichier texte:
            {"url": "http://localhost:3000/myfile.txt",
            "method": 'GET',
            "headers": { "accept": "text/plain" }}
        - GET pour lire un fichier turtle:
            {"url": "http://localhost:3000/myfile.ttl",
            "method": 'GET',
            "headers": { "accept": "text/turtle" }}
        - GET pour obtenir un fichier dans une autre serialisation:
            {"url": "http://localhost:3000/myfile.ttl",
            "method": 'GET',
            "headers": { "accept": "application/ld+json" }}
        - GET pour lire le contenu d'un dossier :
            {"url": "http://localhost:3000/mon_dossier/",
            "method": 'GET',
            "headers": { "accept": "application/json" }}
    la methode DELETE pour supprimer une ressource
        - DELETE:
            {"url": "http://localhost:3000/mon_dossier/le_fichier.txt",
            "method": 'DELETE'}
les methodes PATCH, HEAD, OPTIONS sont également disponibles
PATCH: Modifying resources¶

Modify a resource using N3 Patch:

curl -X PATCH -H "Content-Type: text/n3" \
  --data-raw "@prefix solid: <http://www.w3.org/ns/solid/terms#>. _:rename a solid:InsertDeletePatch; solid:inserts { <ex:s2> <ex:p2> <ex:o2>. }." \
  http://localhost:3000/myfile.ttl

Modify a resource using SPARQL Update:

curl -X PATCH -H "Content-Type: application/sparql-update" \
  -d "INSERT DATA { <ex:s2> <ex:p2> <ex:o2> }" \
  http://localhost:3000/myfile.ttl

HEAD: Retrieve resources headers¶

curl -I -H "Accept: text/plain" \
  http://localhost:3000/myfile.txt

OPTIONS: Retrieve resources communication options¶

curl -X OPTIONS -i http://localhost:3000/myfile.txt



- les dossiers aussi appelés folders ou containers se terminent TOUJOURS par '/'
- Les clés ("accept", "content-type"...) des headers doivent être en miniscule.
    - Pour déplacer un fichier, il faut d'abord créer la copie avec PUT, puis supprimer l'ancien avec DELETE.`,
    inputSchema: { url: z.string(), method: z.string(), headers: z.record(z.string(), z.string()), body: z.string() }
},

    async ({ url, method, headers, body }) => {

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
            let message = { "status": result.status, "statusText": result.statusText, "ok": result.ok, "url": url, "options": options }
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
                    message.body = short_body_json
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
            let content = [{ type: "text", text: String(JSON.stringify({ "status": "ko", "result": e, "url": url, "options": options })) }]
            return { content: content }
        }
    }

)


// server.registerTool("get_folder",
//     {
//         title: "get_folder",
//         description: "Lister le contenu d'un dossier en fournissant son url complete",
//         inputSchema: { full_url: z.string() }
//     },
//     async ({ full_url }) => {
//         // let url = "http://localhost:3000/" + path
//         try {
//             let list_folder = await session.fetch(full_url, {
//                 method: 'GET',
//                 headers: { 'accept': 'application/json' }
//             }
//             )
//             // console.log("post_result_json: ",post_result_json)
//             let folder_list = await list_folder.json()
//             console.log("ok list_folder: ", folder_list)
//             let short_folder_list = folder_list.map((f) => {
//                 // if (f['@id'] != full_url) {
//                 return { "@id": f['@id'] }
//                 // }
//             })
//             console.log(short_folder_list)
//             let content = [{ type: "text", text: String(JSON.stringify({ folder_content: short_folder_list, full_url: full_url })) }]
//             return { content: content }
//         }
//         catch (e) {
//             let content = [{ type: "text", text: String(JSON.stringify(e)) }]
//             return { content: content }
//         }
//     }
// );

server.registerTool("create_folder",
    {
        title: "Create Folder",
        description: "Creer un nouveau dossier {slug} dans le dossier {path} sur un serveur Solid, dans http://localhost:3000/{path}/{slug}/",
        inputSchema: { path: z.string(), slug: z.string() }
    },
    async ({ path, slug }) => {
        try {
            let full_url = "http://localhost:3000/" + path + '/' + slug + '/'
            let headers = {
                'Content-Type': 'text/turtle',
                'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
                'Slug': slug
            };
            // let result = await fetchOperation(session, 'PUT', url, null, headers);
            let folder_create = await session.fetch(full_url, {
                method: 'PUT',
                headers: headers
            })
            console.log("ok post_folder: ", result);
            // return { content: [{ type: "text", text: String(JSON.stringify({ result: folder_create, full_url: full_url })) }] };
            let content = [{ type: "text", text: String(JSON.stringify({ result: folder_create, full_url: full_url })) }]
            console.log("THE CONTENT:", content)
            return { content: content }
        } catch (e) {
            let content = [{ type: "text", text: String(JSON.stringify(e)) }]
            return { content: content }
        }
    }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);