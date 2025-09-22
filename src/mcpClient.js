

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import { LlmClient } from "./llmClient.js";
import { BashCommands } from "./BashCommands.js"

const bc = new BashCommands()

export class MCPClient {

    constructor(options) {
        // this.session = options.session
        // this.pod = options.pod
        this.messages = options.messages
        this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
        // console.log("pod", this.pod)
        // this.pod.current = this.pod.storage
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
                this.tools.map((tool) => tool.function.name)
            );
            // console.log(JSON.stringify(this.tools, null, 2))
        } catch (e) {
            console.log("Failed to connect to MCP server: ", e);
            throw e;
        }
    }

    async chatLoop() {
        this.llm_client = new LlmClient({ mcp: this.mcp, messages: this.messages, tools: this.tools })
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            console.log("\nMCP Client Started!");
            console.log("Type your queries or 'quit' to exit.");
            console.log("Tu peux commencer par taper 'dossiers' pour lister les dossiers.");
            console.log("Pour consulter les messages, tape 'messages'");
            // console.log("bash commandes: ", bc.commands)

            while (true) {
                const message = await rl.question("\nQuery: ");
                if (message.toLowerCase() === "quit") {
                    break;
                }
                if (message.toLowerCase() === 'messages') {
                    this.llm_client.log_messages()
                } else {
                    // let msg_split = message.trim().split(" ")
                    // let cmd_potentielle = msg_split.shift().toLowerCase()
                    // let complement = ""
                    // if (bc.commands.includes(cmd_potentielle)) {

                    //     const args = msg_split.join(" ")
                    //     console.log("args", args)
                    //     complement = "\n" + await bc[cmd_potentielle](args, this.mcp)
                    // }

                    // const response = await this.llm_client.processQuery(message+complement)
                    const response = await this.llm_client.processQuery(message)
                    console.log("\nmcpclient , add to messages ?" + response);

                }
            }
        } finally {
            rl.close();
        }
    }

    async cleanup() {
        await this.mcp.close();
    }

}