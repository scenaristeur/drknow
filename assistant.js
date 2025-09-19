import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import OpenAI from 'openai';
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })


// let tools = [
//     {
//         "type": "function",
//         "function": {
//             "name": "get_weather",
//             "description": "Obtenir la météo actuelle pour une ville donnée",
//             "parameters": {
//                 "type": "object",
//                 "properties": {
//                     "city": {
//                         "type": "string",
//                         "description": "Nom de la ville, ex: 'Paris'"
//                     }
//                 },
//                 "required": ["city"]
//             }
//         }
//     },
//     {
//         "type": "function",
//         "function": {
//             "name": "get_air_quality",
//             "description": "Obtenir l'indice de qualité de l'air (AQI) pour une ville donnée",
//             "parameters": {
//                 "type": "object",
//                 "properties": {
//                     "city": {
//                         "type": "string",
//                         "description": "Nom de la ville"
//                     }
//                 },
//                 "required": ["city"]
//             }
//         }
//     }
// ]

// // Implémentations des tools
// function get_weather(city) {
//     return { "city": city, "temp_c": 22, "condition": "Ensoleillé" }
// }


// function get_air_quality(city) {
//     return { "city": city, "aqi": 42, "level": "Bon" }
// }


// let tool_registry = {
//     "get_weather": get_weather,
//     "get_air_quality": get_air_quality,
// }


class MCPClient {

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
            baseURL: process.env['OPENAI_BASE_URL']
        });
        this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
    }

    async connectToServer(serverScriptPath) {
        try {
            const isJs = serverScriptPath.endsWith(".js");
            const isPy = serverScriptPath.endsWith(".py");
            if (!isJs && !isPy) {
                throw new Error("Server script must be a .js or .py file");
            }
            const command = isPy
                ? process.platform === "win32"
                    ? "python"
                    : "python3"
                : process.execPath;

            this.transport = new StdioClientTransport({
                command,
                args: [serverScriptPath],
            });
            await this.mcp.connect(this.transport);

            const toolsResult = await this.mcp.listTools();
            this.tools = toolsResult.tools.map((tool) => {

                // return {
                //     name: tool.name,
                //     description: tool.description,
                //     input_schema: tool.inputSchema,
                // };
                return {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.inputSchema
                    }
                }
            });
            console.log(
                "Connected to server with tools:",
                this.tools.map(({ name }) => name)
            );
            console.log(JSON.stringify(this.tools, null, 2))
        } catch (e) {
            console.log("Failed to connect to MCP server: ", e);
            throw e;
        }
    }

    async chatLoop() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            console.log("\nMCP Client Started!");
            console.log("Type your queries or 'quit' to exit.");

            while (true) {
                const message = await rl.question("\nQuery: ");
                if (message.toLowerCase() === "quit") {
                    break;
                }
                const response = await this.processQuery(message);
                console.log("\n" + response);
            }
        } finally {
            rl.close();
        }
    }

    async processQuery(query) {
        const messages = [
            {
                role: "user",
                content: query,
            },
        ];

        const response = await this.client.chat.completions.create({
            model: process.env['MODEL'],
            // max_tokens: 1000,
            messages,
            // tools: tools
            tools: this.tools, // MCP ne fonctionne pas ???
            // tool_choice: "auto"
        });

        console.log(response)
        console.log(response.choices[0].message.content)
        let msg = response.choices[0].message
        console.log(msg)
        console.log(msg.tool_calls)

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
                let c = call_tool.split("{")
                const toolName = c[0] //content.name;
                const toolArgs = JSON.parse('{' + c[1]) //content.input | undefined;

                console.log(toolName)
                console.log(toolArgs)
                const result = await this.mcp.callTool({
                    name: toolName,
                    arguments: toolArgs,
                });
                finalText.push(
                    `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
                );

                console.log(result.content[0])

                messages.push({
                    role: "user",
                    content: result.content[0].text,
                });


                // }
            }
        }
        const response_after = await this.client.chat.completions.create({
            model: process.env['MODEL'],
            max_tokens: 1000,
            messages,
        });

        finalText.push(
            response_after.choices[0].message.content
        );

        return finalText.join("\n");
    }


    async cleanup() {
        await this.mcp.close();
    }

}



async function main() {
    if (process.argv.length < 3) {
        console.log("Usage: node index.ts <path_to_server_script>");
        return;
    }
    const mcpClient = new MCPClient();
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
