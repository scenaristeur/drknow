# Community solid server
- https://communitysolidserver.github.io/CommunitySolidServer/latest/usage/starting-server/

```
npm install -g @solid/community-server
community-solid-server -c @css:config/file.json -f data/

```
- open localhost:3000
- register
- login
- create pod
- create token
- update .env

```
npm install
cd experiments
node operations.js
```

# mcp
- https://www.youtube.com/watch?v=Ek8JHgZtmcI scratch
- https://www.youtube.com/watch?v=mhdGVbJBswA usage
- client https://modelcontextprotocol.info/docs/tutorials/building-a-client-node/
- https://medium.com/@__nagarajan__/building-and-accessing-local-mcp-server-using-open-ai-agent-with-node-js-5cbe626145eb


# run

node assistant.js mcp_server.js

quel temps fait-il à Lyon, Bordeaux et Marseille ?

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