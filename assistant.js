

import { MCPClient } from "./src/mcpClient.js";

const systemPrompt = `Tu es Dr Know, expert en Web sémantique, RDF, jsonld, turtle/n3.
Tu as accès des outils pour interagir avec un serveur Solid à l'url "http://localhost:3000/".
le dossier de l'utilisateur courant est "david", son dossier est accessible avec l'outil
'get_folder' à l'adresse "http://localhost:3000/david/".
On travaille toujours dans le dossier 'holacratie' (http://localhost:3000/david/holacratie/).
Commence par lister ce dossier pour connaître les sous-dossiers disponibles et les projets en cours.
`


const options = {
    messages: [{
        role: "system",
        content: systemPrompt
    }]
}

// const mcpClient = new MCPClient()

async function main() {
    if (process.argv.length < 3) {
        console.log("Usage: node index.ts <path_to_server_script>");
        return;
    }
    const mcpClient = new MCPClient(options);
    try {
        await mcpClient.connectToServer(process.argv[2]);
        await mcpClient.chatLoop();
    } catch (e) {

        console.log(e)
    } finally {
        await mcpClient.cleanup();
        process.exit(0);
    }
}

main();
