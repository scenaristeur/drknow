import OpenAI from 'openai';
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

// import { MCPServerStdio } from "@openai/agents";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const mcpServer = new McpServer({
    name: "weather",
    fullCommand: "node ./mcp.js"
})
await mcpServer.connect();

const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted

    baseURL: process.env['OPENAI_BASE_URL']
});

//# Appel simple au LLM
let response = await client.chat.completions.create({
    model: process.env['MODEL'],
    messages: [
        { "role": "system", "content": "Tu es un assistant Python minimaliste." },
        { "role": "user", "content": "Donne-moi un haïku sur la pluie." }
    ],
    tools: [mcpServer]
}
)
console.log(response)
console.log(response.choices[0].message.content)