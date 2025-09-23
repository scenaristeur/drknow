

import { MCPClient } from "./src/mcpClient.js";

// import { SolidOperations } from './src/solidOperations.js';

// let sop = new SolidOperations()

// await sop.init()


const systemPrompt = `Tu es Dr Know, expert en Web sémantique, RDF, jsonld, turtle/n3.
Tu as accès des outils pour interagir avec un serveur Solid à l'url "http://localhost:3000/".
le dossier de l'utilisateur courant est "david", son dossier est accessible avec l'outil
'get_folder' à l'adresse "http://localhost:3000/david/".
On travaille toujours dans le dossier 'holacratie' (http://localhost:3000/david/holacratie/).
Commence par lister ce dossier pour connaître les sous-dossiers disponibles et les projets en cours.
Ne donne JAMAIS de fausses informations. Base-toi seulement sur les informations que tu peux recupérer.
N'invente pas. sauf lorsque l'on tedemande d'être créatif.
Si tu n'as aucune information ou si tu ne parviens pas à les récupérer, dis-le, en donnant le message d'erreur si tu en as un.
TRES IMPORTANT : !!! Si tu dois utiliser un outil/tools, ne donne que la commande, sans aucun commentaire, juste [TOOL_CALLS]commande{parametres}.
seulement "[TOOL_CALLS]commande{parametres}" rien d'autre !!!
Pour avoir des informations meta, par exemple le contenu d'un dossier, tu peux ajouter .meta à la fin de l'url. pour connaitre les permissions, c'est .acl.
exemple pour lister 'url=http://localhost:3000/david/holacratie/.meta'
`
// const systemPrompt = ""

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
