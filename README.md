# mise en condition
- règle numero 1: Ne rien commencer sans avoir de la bonne musique : https://www.radiofrance.fr/fip/radio-groove
et notamment https://www.radiofrance.fr/fip/podcasts/fip-tape/wish-you-were-here-de-pink-floyd-fete-ses-50-ans-5851747

Bon maintenant que l'on est bien calé, passons aux choses sérieuses : 
un serveur Solid

# Community solid server
- https://communitysolidserver.github.io/CommunitySolidServer/latest/usage/starting-server/

```
npm install -g @solid/community-server
community-solid-server -c @css:config/file.json -f data/

```
- open localhost:3000
- register
- login http://localhost:3000/.account/login/
- create pod
- create token
- update .env

```
npm install
cd experiments
node operations.js
```



# run
Lancement de l'assistant avec le serveur mcp

`node assistant.js mcp_server.js`

> quel temps fait-il à Lyon, Bordeaux et Marseille ?

> quels documents sont présents sur le serveur, dans le dossier 'david' ?


# Holacratie
- https://github.com/holacracyone/Holacracy-Constitution-4.1-FRENCH/blob/master/Constitution-Holacracy.md

# reponse 
albert-small
{
  role: 'assistant',
  content: '{"name": "get_weather", "parameters": {"city": "Lyon"}}',
  refusal: null,
  annotations: null,
  audio: null,
  function_call: null,
  tool_calls: [],
  reasoning_content: null
}

albert-large
{
  role: 'assistant',
  content: '[TOOL_CALLS]get_weather{"city": "Lyon"}',
  refusal: null,
  annotations: null,
  audio: null,
  function_call: null,
  tool_calls: [],
  reasoning_content: null
}


# slug
- create file
- https://forum.solidproject.org/t/my-first-app-adding-resources/275/2
I think I can answer at least one of your questions - about the slug and the link:

// add a file to a directory
//
var link = ‘http://www.w3.org/ns/ldp#Resource; rel=“type”’
var filename = ‘myfile.ttl’
var parentFolder = “https://me.solid.community/public/somepath/”
var request = {
method : ‘POST’,
headers : { ‘Content-Type’:‘text/turtle’,slug:filename,link:link }
}
solid.auth.fetch( parentFolder, request ) // …

and add body : content-of-the-file after headers to both create the file and add content in the same fetch.

- create folder using .dummy file

https://forum.solidproject.org/t/my-first-app-adding-resources/275/9

# inrupt CRUD
- https://docs.inrupt.com/sdk/javascript-sdk/read-and-write-files

# mcp
- https://www.youtube.com/watch?v=Ek8JHgZtmcI scratch
- https://www.youtube.com/watch?v=mhdGVbJBswA usage
- client https://modelcontextprotocol.info/docs/tutorials/building-a-client-node/
- https://medium.com/@__nagarajan__/building-and-accessing-local-mcp-server-using-open-ai-agent-with-node-js-5cbe626145eb
