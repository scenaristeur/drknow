import dotenv from 'dotenv'
import OpenAI from 'openai';


dotenv.config({ path: './.env' })


export class LlmClient {

    constructor(options) {
        this.mcp = options.mcp
        this.messages = options.messages
        this.tools = options.tools
        this.client = new OpenAI({
            apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
            baseURL: process.env['OPENAI_BASE_URL']
        });


    }

    async processQuery(query) {
        this.messages.push(
            {
                role: "user",
                content: query,
            })

        const response = await this.client.chat.completions.create({
            model: process.env['MODEL'],
            // max_tokens: 1000,
            messages: this.messages,
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

                this.messages.push({
                    role: "user",
                    content: result.content[0].text,
                });


                // }
            }
        }
        const response_after = await this.client.chat.completions.create({
            model: process.env['MODEL'],
            max_tokens: 1000,
            messages: this.messages,
            tools: this.tools
        });

        finalText.push(
            response_after.choices[0].message.content
        );

        return finalText.join("\n");
    }
}