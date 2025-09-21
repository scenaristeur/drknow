https://zod.dev/

Hi!

I'm an AI assistant trained on documentation, help articles, and other content.

Ask me anything about Zod.
j'ai un problème avec ce schema : 
inputSchema: { url: z.string(), method: z.string(), headers: z.object(), body: z.string() }

pour valider cette proposition : call: interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {"content-type": "text/plain"}, "body": "mlkhlihh ouigioug"}

j'ai une erreur : SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
cela semble concerner headers au format object

Le problème vient probablement de la définition de headers dans ton schéma. Dans Zod, si tu veux valider un objet avec des propriétés dynamiques comme des headers HTTP (par exemple : {"content-type": "text/plain"}), il faut utiliser z.record(z.string(), z.string()) au lieu de z.object(). Un schéma z.object() sans propriétés ne permet pas d'avoir des clés arbitraires1.

Voici comment tu pourrais définir ton schéma :

typescript

const inputSchema = z.object({
  url: z.string(),
  method: z.string(),
  headers: z.record(z.string(), z.string()),
  body: z.string(),
});

1

Cela permettra de valider des objets headers avec des clés et valeurs de type string, comme dans ton exemple.
Sources
Docs
Defining schemas
Defining schemas
toujours le même soucis : 

Query: creons un nouveau partenaire mack.txt avec le contenu "mlkhlihh ouigioug"
[
  '',
  `interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {'content-type': 'text/plain'}, "body": "mlkhlihh ouigioug"}`
]
calls [
  `interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {'content-type': 'text/plain'}, "body": "mlkhlihh ouigioug"}`
] 1
call: interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {'content-type': 'text/plain'}, "body": "mlkhlihh ouigioug"}
!!!!!!!
ERREUR:  SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at LlmClient.processQuery (file:///home/smag/dev/drknow/src/llmClient.js:74:43)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async MCPClient.chatLoop (file:///home/smag/dev/drknow/src/mcpClient.js:76:34)
    at async main (file:///home/smag/dev/drknow/assistant.js:31:9)

undefined

Le souci ne vient pas du schéma Zod, mais du format de ta chaîne JSON. Dans ton appel, tu utilises des guillemets simples pour les clés et valeurs de l’objet headers :

json

"headers": {'content-type': 'text/plain'}

Or, le format JSON valide exige des guillemets doubles pour toutes les clés et les valeurs. Voici la bonne syntaxe :

json

"headers": {"content-type": "text/plain"}

En corrigeant ton appel ainsi, le parsing JSON et la validation Zod fonctionneront correctement.

Vérifie que la chaîne passée à JSON.parse est bien une chaîne JSON valide avec uniquement des guillemets doubles1.
Sources
Zod
pas mieux : 

Query: creons un nouveau partenaire mack.txt avec le contenu "mlkhlihh ouigioug"
[
  '',
  'interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {"content-type": "text/plain"}, "body": "mlkhlihh ouigioug"}'
]
calls [
  'interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {"content-type": "text/plain"}, "body": "mlkhlihh ouigioug"}'
] 1
call: interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {"content-type": "text/plain"}, "body": "mlkhlihh ouigioug"}
!!!!!!!
ERREUR:  SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at LlmClient.processQuery (file:///home/smag/dev/drknow/src/llmClient.js:74:43)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async MCPClient.chatLoop (file:///home/smag/dev/drknow/src/mcpClient.js:76:34)
    at async main (file:///home/smag/dev/drknow/assistant.js:31:9)

undefined

Le problème vient du fait que ta chaîne n'est pas un vrai JSON isolé, mais une commande suivie d'un objet JSON sans séparation claire. Exemple :

interacting_with_solid_server{"url": "..."}

Ce n'est PAS un JSON valide : il manque soit une clé de début, soit tu dois extraire la partie JSON avant de la parser.

Solution :

Il faut extraire la sous-chaîne qui correspond exactement à l’objet JSON (c’est-à-dire tout après interacting_with_solid_server), puis appliquer JSON.parse uniquement sur cette partie :

js

const rawInput = 'interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {"content-type": "text/plain"}, "body": "mlkhlihh ouigioug"}';
// Extraction de la partie JSON
const jsonString = rawInput.replace(/^interacting_with_solid_server/, '');
const parsed = JSON.parse(jsonString);

Assure-toi que la partie passée à JSON.parse commence bien par { et finit par }.

Ton schéma Zod fonctionnera ensuite correctement avec ce résultat, car il attend un objet, pas une chaîne précédée d’un préfixe texte1.
Sources
Zod
effectivement, c'est mon parsing qui doit poser problème pour recupérer les [TOOL_CALLS]

ça me donne ça : 

node assistant.js mcp_server.js 
[dotenv@17.2.2] injecting env (6) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
{
  messages: [
    {
      role: 'system',
      content: 'Tu es Dr Know, expert en Web sémantique, RDF, jsonld, turtle/n3.\n' +
        `Tu as accès des outils pour interagir avec un serveur Solid à l'url "http://localhost:3000/".\n` +
        `le dossier de l'utilisateur courant est "david", son dossier est accessible avec l'outil\n` +
        `'get_folder' à l'adresse "http://localhost:3000/david/".\n` +
        "On travaille toujours dans le dossier 'holacratie' (http://localhost:3000/david/holacratie/).\n" +
        'Commence par lister ce dossier pour connaître les sous-dossiers disponibles et les projets en cours.\n'
    }
  ]
}
Connected to server with tools: [
  'get_weather',
  'interacting_with_solid_server',
  'get_folder',
  'create_folder'
]

MCP Client Started!
Type your queries or 'quit' to exit.

Query: dossiers
{
  role: 'assistant',
  content: '[TOOL_CALLS]get_folder{"full_url": "http://localhost:3000/david/holacratie/"}',
  refusal: null,
  annotations: null,
  audio: null,
  function_call: null,
  tool_calls: [],
  reasoning_content: null
}
[]
[TOOL_CALLS]get_folder{"full_url": "http://localhost:3000/david/holacratie/"}
[
  '',
  'get_folder{"full_url": "http://localhost:3000/david/holacratie/"}'
]
calls [ 'get_folder{"full_url": "http://localhost:3000/david/holacratie/"}' ] 1
call: get_folder{"full_url": "http://localhost:3000/david/holacratie/"}
[
  'get_folder',
  '"full_url": "http://localhost:3000/david/holacratie/"}'
]
toolname get_folder
toolArgs { full_url: 'http://localhost:3000/david/holacratie/' }
{
  type: 'text',
  text: '{"folder_content":[null,{"@id":"http://localhost:3000/david/holacratie/acteurs/"},{"@id":"http://localhost:3000/david/holacratie/organisations/"},{"@id":"http://localhost:3000/david/holacratie/partenaires/"},{"@id":"http://localhost:3000/david/holacratie/constitution/"},null,{"@id":"http://localhost:3000/david/holacratie/acteurs/"},{"@id":"http://localhost:3000/david/holacratie/organisations/"},{"@id":"http://localhost:3000/david/holacratie/partenaires/"},{"@id":"http://localhost:3000/david/holacratie/constitution/"}],"full_url":"http://localhost:3000/david/holacratie/"}'
}
{
  index: 0,
  message: {
    role: 'assistant',
    content: 'Les dossiers disponibles dans le dossier "holacratie" sont les suivants :\n' +
      '\n' +
      '- Acteurs : http://localhost:3000/david/holacratie/acteurs/\n' +
      '- Organisations : http://localhost:3000/david/holacratie/organisations/\n' +
      '- Partenaires : http://localhost:3000/david/holacratie/partenaires/\n' +
      '- Constitution : http://localhost:3000/david/holacratie/constitution/\n' +
      '\n' +
      'Quels dossiers souhaitez-vous explorer en détail ?',
    refusal: null,
    annotations: null,
    audio: null,
    function_call: null,
    tool_calls: [],
    reasoning_content: null
  },
  logprobs: null,
  finish_reason: 'stop',
  stop_reason: null
}
###MESSAGES/n [
  {
    role: 'system',
    content: 'Tu es Dr Know, expert en Web sémantique, RDF, jsonld, turtle/n3.\n' +
      `Tu as accès des outils pour interagir avec un serveur Solid à l'url "http://localhost:3000/".\n` +
      `le dossier de l'utilisateur courant est "david", son dossier est accessible avec l'outil\n` +
      `'get_folder' à l'adresse "http://localhost:3000/david/".\n` +
      "On travaille toujours dans le dossier 'holacratie' (http://localhost:3000/david/holacratie/).\n" +
      'Commence par lister ce dossier pour connaître les sous-dossiers disponibles et les projets en cours.\n'
  },
  { role: 'user', content: 'dossiers' },
  {
    role: 'assistant',
    content: 'get_folder{"full_url": "http://localhost:3000/david/holacratie/"}'
  },
  {
    role: 'user',
    content: '{"folder_content":[null,{"@id":"http://localhost:3000/david/holacratie/acteurs/"},{"@id":"http://localhost:3000/david/holacratie/organisations/"},{"@id":"http://localhost:3000/david/holacratie/partenaires/"},{"@id":"http://localhost:3000/david/holacratie/constitution/"},null,{"@id":"http://localhost:3000/david/holacratie/acteurs/"},{"@id":"http://localhost:3000/david/holacratie/organisations/"},{"@id":"http://localhost:3000/david/holacratie/partenaires/"},{"@id":"http://localhost:3000/david/holacratie/constitution/"}],"full_url":"http://localhost:3000/david/holacratie/"}'
  },
  {
    role: 'assistant',
    content: 'Les dossiers disponibles dans le dossier "holacratie" sont les suivants :\n' +
      '\n' +
      '- Acteurs : http://localhost:3000/david/holacratie/acteurs/\n' +
      '- Organisations : http://localhost:3000/david/holacratie/organisations/\n' +
      '- Partenaires : http://localhost:3000/david/holacratie/partenaires/\n' +
      '- Constitution : http://localhost:3000/david/holacratie/constitution/\n' +
      '\n' +
      'Quels dossiers souhaitez-vous explorer en détail ?'
  }
]

[Calling tool get_folder with args {"full_url":"http://localhost:3000/david/holacratie/"}]
Les dossiers disponibles dans le dossier "holacratie" sont les suivants :

- Acteurs : http://localhost:3000/david/holacratie/acteurs/
- Organisations : http://localhost:3000/david/holacratie/organisations/
- Partenaires : http://localhost:3000/david/holacratie/partenaires/
- Constitution : http://localhost:3000/david/holacratie/constitution/

Quels dossiers souhaitez-vous explorer en détail ?

Query: creons un nouveau partenaire mack.txt avec le contenu "mlkhlihh ouigioug"
{
  role: 'assistant',
  content: '[TOOL_CALLS]interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {"Content-Type": "text/plain"}, "body": "mlkhlihh ouigioug"}',
  refusal: null,
  annotations: null,
  audio: null,
  function_call: null,
  tool_calls: [],
  reasoning_content: null
}
[]
[TOOL_CALLS]interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {"Content-Type": "text/plain"}, "body": "mlkhlihh ouigioug"}
[
  '',
  'interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {"Content-Type": "text/plain"}, "body": "mlkhlihh ouigioug"}'
]
calls [
  'interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {"Content-Type": "text/plain"}, "body": "mlkhlihh ouigioug"}'
] 1
call: interacting_with_solid_server{"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": {"Content-Type": "text/plain"}, "body": "mlkhlihh ouigioug"}
[
  'interacting_with_solid_server',
  '"url": "http://localhost:3000/david/holacratie/partenaires/mack.txt", "method": "PUT", "headers": ',
  '"Content-Type": "text/plain"}, "body": "mlkhlihh ouigioug"}'
]
!!!!!!!
ERREUR:  SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at LlmClient.processQuery (file:///home/smag/dev/drknow/src/llmClient.js:76:43)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async MCPClient.chatLoop (file:///home/smag/dev/drknow/src/mcpClient.js:76:34)
    at async main (file:///home/smag/dev/drknow/assistant.js:31:9)

undefined

Query: 

avec ce parser : 

 let msg = response.choices[0].message
            console.log(msg)
            console.log(msg.tool_calls)
            console.log(msg.content)

            const finalText = [];

            let calls = msg.content.split("[TOOL_CALLS]")
            console.log(calls)
            if (calls.length == 1) {
                finalText.push(msg.content)
            } else {
                if (calls[0].length > 0) {
                    finalText.push(calls[0])
                }
                calls.shift()
                // messages.append(msg.content)
                //         # Si pas de tool_calls → réponse finale
                //     if not msg.tool_calls:
                //     print("Réponse finale :", msg.content)
                //     break

                // # Ajoute le message assistant avec les tool_calls
                //     messages.append(msg)
                console.log("calls", calls, calls.length)
                for (const call_tool of calls) {
                    // if (content.type === "text") {
                    //     finalText.push(content.text);
                    // } else if (content.type === "tool_use") {
                    console.log("call:", call_tool)
                    this.messages.push({
                        role: "assistant",
                        content: call_tool,
                    });
                    let c = call_tool.split("{")
                    console.log(c)
                    const toolName = c[0] //content.name;
                    const toolArgs = JSON.parse('{' + c[1]) //content.input | undefined;

                    console.log("toolname", toolName)
                    console.log("toolArgs", toolArgs)
                    const result = await this.mcp.callTool({
                        name: toolName,
                        arguments: toolArgs,
                    });
                    finalText.push(
                        `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
                    );

                    console.log(result.content[0])


Tu peux me proposer une autre manière de faire pour récupérer tous les appels à [TOOL_CALLS]

ça marchait pourtant bien pour :

Query: quelle est la météo à Lyon, Bordeaux et Marseille ?
{
  role: 'assistant',
  content: '[TOOL_CALLS]get_weather{"city": "Lyon"}[TOOL_CALLS]get_weather{"city": "Bordeaux"}[TOOL_CALLS]get_weather{"city": "Marseille"}',
  refusal: null,
  annotations: null,
  audio: null,
  function_call: null,
  tool_calls: [],
  reasoning_content: null
}
[]
[TOOL_CALLS]get_weather{"city": "Lyon"}[TOOL_CALLS]get_weather{"city": "Bordeaux"}[TOOL_CALLS]get_weather{"city": "Marseille"}
[
  '',
  'get_weather{"city": "Lyon"}',
  'get_weather{"city": "Bordeaux"}',
  'get_weather{"city": "Marseille"}'
]
calls [
  'get_weather{"city": "Lyon"}',
  'get_weather{"city": "Bordeaux"}',
  'get_weather{"city": "Marseille"}'
] 3
call: get_weather{"city": "Lyon"}
[ 'get_weather', '"city": "Lyon"}' ]
toolname get_weather
toolArgs { city: 'Lyon' }
{
  type: 'text',
  text: '{"city":"Lyon","temp_c":15,"condition":"Ensoleillé"}'
}
call: get_weather{"city": "Bordeaux"}
[ 'get_weather', '"city": "Bordeaux"}' ]
toolname get_weather
toolArgs { city: 'Bordeaux' }
{
  type: 'text',
  text: '{"city":"Bordeaux","temp_c":38,"condition":"Ensoleillé"}'
}
call: get_weather{"city": "Marseille"}
[ 'get_weather', '"city": "Marseille"}' ]
toolname get_weather
toolArgs { city: 'Marseille' }
{
  type: 'text',
  text: '{"city":"Marseille","temp_c":13,"condition":"Ensoleillé"}'
}

Ton parsing actuel fonctionne pour des JSON simples (comme get_weather{"city": "Lyon"}), mais échoue si le JSON contient des accolades imbriquées ou des valeurs complexes.

En effet, split("{") ne gère pas les structures imbriquées et peut casser si une valeur contient { ou }.

Proposition robuste :
Utilise une expression régulière pour trouver tous les blocs [TOOL_CALLS]nomOutil{...} et extraire proprement chaque JSON associé, même avec des objets imbriqués.

Voici une méthode adaptée :

javascript

// Récupère tous les appels TOOL_CALLS avec leur JSON complet
const regex = /\[TOOL_CALLS\]([a-zA-Z0-9_]+)(\{(?:[^{}]|(?2))*\})/g;

let calls = [];
let match;
while ((match = regex.exec(msg.content)) !== null) {
  const toolName = match[1];
  const jsonString = match[2];
  const toolArgs = JSON.parse(jsonString);
  calls.push({ toolName, toolArgs });
}

Cette regex :

    capture le nom de l’outil après [TOOL_CALLS],
    extrait tout le JSON (même s’il y a des accolades dans les valeurs, grâce à la récursivité du groupe).

Ainsi, tu peux parser n’importe quelle séquence [TOOL_CALLS]nomOutil{...} de façon fiable, quel que soit le contenu JSON.

Tu pourras ensuite itérer sur calls pour appeler chaque outil avec les bons arguments.

 TypeError: regex.exec is not a function

L’erreur TypeError: regex.exec is not a function indique que ta variable regex n’est pas une RegExp, mais probablement une string.

Vérifie la déclaration :
Pour utiliser .exec(), il faut déclarer le regex comme un objet RegExp et non comme une chaîne de caractères.

Correction :

js

const regex = /\[TOOL_CALLS\]([a-zA-Z0-9_]+)(\{(?:[^{}]|(?2))*\})/g;

et pas :

js

const regex = "[TOOL_CALLS]([a-zA-Z0-9_]+)(\\{(?:[^{}]|(?2))*\\})";

Résumé :

    Regarde bien que tu utilises /.../g (littéral RegExp) et pas des guillemets "...".
    Avec un RegExp, .exec() fonctionne correctement en JavaScript.

Si tu déclares bien le regex comme ci-dessus, la boucle while ((match = regex.exec(msg.content)) !== null) { ... } fonctionnera.
            const regex = /\[TOOL_CALLS\]([a-zA-Z0-9_]+)(\{(?:[^{}]|(?2))*\})/g;
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

SyntaxError: Invalid regular expression: /\[TOOL_CALLS\]([a-zA-Z0-9_]+)(\{(?:[^{}]|(?2))*\})/g: Invalid group

Le problème vient du fait que les expressions régulières JavaScript ne supportent pas la récursivité de groupe comme (?2). Cette syntaxe n’est pas valide en JavaScript (elle existe en PCRE, pas en JS).

Solution simple et robuste :
Fais un split sur [TOOL_CALLS], puis récupère le nom de l’outil et la partie JSON en coupant à la première accolade {, et tout le reste jusqu’à la fermeture de l’accolade correspondante. Pour gérer les objets imbriqués, il faut parser manuellement les accolades.

Voici une fonction de parsing qui fonctionne en JavaScript :

js

function extractToolCalls(text) {
  const results = [];
  const parts = text.split('[TOOL_CALLS]');
  for (const part of parts) {
    if (!part.trim()) continue;
    const firstBrace = part.indexOf('{');
    if (firstBrace === -1) continue;
    const toolName = part.slice(0, firstBrace).trim();
    // Trouver la fin du JSON avec comptage d'accolades
    let braceCount = 0;
    let end = firstBrace;
    for (; end < part.length; end++) {
      if (part[end] === '{') braceCount++;
      if (part[end] === '}') braceCount--;
      if (braceCount === 0) break;
    }
    const jsonString = part.slice(firstBrace, end + 1);
    let toolArgs = null;
    try {
      toolArgs = JSON.parse(jsonString);
    } catch (e) {
      // Gérer l'erreur de parsing si besoin
      continue;
    }
    results.push({ toolName, toolArgs });
  }
  return results;
}

Cette fonction gère correctement les objets imbriqués et ne dépend pas d’une regex récursive (impossible en JS standard).
