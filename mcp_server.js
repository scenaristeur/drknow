import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";


// to test the session
import { SolidOperations } from './src/solidOperations.js';
let sop = new SolidOperations()
await sop.init()


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
        - PUT pour créer un dossier
            {"url": "http://localhost:3000/" + path + '/' + slug + '/',
            headers: {
                'Content-Type': 'text/turtle',
                'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
                'Slug': slug
            };
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

Modify a resource using SPARQL Update:

curl -X PATCH -H "Content-Type: application/sparql-update" \
  -d "INSERT DATA { <ex:s2> <ex:p2> <ex:o2> }" \
  http://localhost:3000/myfile.ttl
  ou une modification plus complexe
# debut modif qu'il faut envoyer dans le body :
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
@prefix ex: <http://example.org/>

DELETE {?s ?p ?o}
INSERT {?s ex:title "foo" ;
           ex:description "bar" ;
           rdf:type ex:FooBar .
       }
WHERE  { ?s ?p ?o .
         FILTER (?s = ex:subject1)
}
#fin modif

Modify a resource using N3 Patch(ne pas oublier le prefix 'solid:':

curl -X PATCH -H "Content-Type: text/n3" \
  --data-raw "@prefix solid: <http://www.w3.org/ns/solid/terms#>. _:rename a solid:InsertDeletePatch; solid:inserts { <ex:s2> <ex:p2> <ex:o2>. }." \
  http://localhost:3000/myfile.ttl

HEAD: Retrieve resources headers

curl -I -H "Accept: text/plain" \
  http://localhost:3000/myfile.txt

OPTIONS: Retrieve resources communication options¶

curl -X OPTIONS -i http://localhost:3000/myfile.txt

- les dossiers aussi appelés folders ou containers se terminent TOUJOURS par '/'
- Les clés ("accept", "content-type"...) des headers doivent être en miniscule.
    - Pour déplacer un fichier, il faut d'abord créer la copie avec PUT, puis supprimer l'ancien avec DELETE.`,
    inputSchema: { url: z.string(), method: z.string().optional(), headers: z.record(z.string(), z.string()).optional(), body: z.string().optional() }
},
    async ({ url, method, headers, body }) => {
        return sop.fetch({ url, method, headers, body })
    }
)


// server.registerTool("create_folder",
//     {
//         title: "Create Folder",
//         description: "Creer un nouveau dossier {slug} dans le dossier {path} sur un serveur Solid, dans http://localhost:3000/{path}/{slug}/",
//         inputSchema: { path: z.string(), slug: z.string() }
//     },
//     async ({ path, slug }) => {
//         try {
//             let full_url = "http://localhost:3000/" + path + '/' + slug + '/'
//             let headers = {
//                 'Content-Type': 'text/turtle',
//                 'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
//                 'Slug': slug
//             };
//             // let result = await fetchOperation(session, 'PUT', url, null, headers);
//             let folder_create = await session.fetch(full_url, {
//                 method: 'PUT',
//                 headers: headers
//             })
//             console.log("ok post_folder: ", result);
//             // return { content: [{ type: "text", text: String(JSON.stringify({ result: folder_create, full_url: full_url })) }] };
//             let content = [{ type: "text", text: String(JSON.stringify({ result: folder_create, full_url: full_url })) }]
//             console.log("THE CONTENT:", content)
//             return { content: content }
//         } catch (e) {
//             let content = [{ type: "text", text: String(JSON.stringify(e)) }]
//             return { content: content }
//         }
//     }
// );

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

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);