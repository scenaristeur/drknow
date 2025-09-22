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
        try {
            this.messages.push(
                {
                    role: "user",
                    content: query,
                })

            const response = await this.client.chat.completions.create({
                model: process.env['MODEL'],
                // max_tokens: 1000,
                messages: this.messages,
                tools: this.tools,
                // tool_choice: "auto"
            });


            // console.log(response.choices[0].message.content)
            let msg = response.choices[0].message
            // console.log(msg)
            // console.log(msg.tool_calls)
            // console.log(msg.content)
            this.messages.push({
                role: "assistant",
                content: msg.content,
            });

            const finalText = [];
            finalText.push(msg.content)

            console.log("\nCONTENT", msg.content)
            let calls = this.extractToolCalls(msg.content)
            console.log("\nCALLS", calls)
            for (const call_tool of calls) {
                // if (content.type === "text") {
                //     finalText.push(content.text);
                // } else if (content.type === "tool_use") {
                // console.log("call:", call_tool)
                // this.messages.push({
                //     role: "assistant",
                //     content: JSON.stringify(call_tool),
                // });
                let tool_names = this.tools.map((tool) => tool.function.name)
                // console.log("toolArgs", call_tool.toolArgs)
                if (tool_names.includes(call_tool.toolName)) {
                    // console.log("toolname", call_tool.toolName)
                    // console.log("toolArgs", call_tool.toolArgs)
                    const result = await this.mcp.callTool({
                        name: call_tool.toolName,
                        arguments: call_tool.toolArgs,
                    });
                    console.log("RESULT:", result)
                    finalText.push(
                        `[Calling tool ${call_tool.toolName} with args ${JSON.stringify(call_tool.toolArgs)}]`
                    );
                    this.messages.push({
                        role: "user",
                        content: result.content[0].text,
                    });
                } else {
                    console.log(" !!Pas de tool nommé __", call_tool.toolName) + "__"
                    this.messages.push({
                        role: "user",
                        content: "!!Pas de tool nommé __" + call_tool.toolName + "__",
                    });
                }
                // console.log(result.content[0])






                // }
            }

            // console.log("THIS MESSAAGES TO SEND : ", this.messages)

            const response_after = await this.client.chat.completions.create({
                model: process.env['MODEL'],
                // max_tokens: 1000,
                messages: this.messages,
                // tools: this.tools
            });
            let response_after_result = response_after.choices[0].message.content
            // console.log(response_after.choices[0])
            finalText.push(
                response_after_result
            );
            this.messages.push({
                role: "assistant",
                content: response_after_result,
            });
            // console.log("###MESSAGES/n", this.messages)
            return finalText.join("\n");
        }
        catch (e) {
            console.log("!!!!!!!\nERREUR: ", e)
        }
    }

    log_messages() {
        console.log(this.messages)
    }
    extractToolCalls(toolcalls) {
        const results = [];
        console.log("typeof", typeof toolcalls)
        console.log("toolcalls.toolname", toolcalls.toolName)
        const parts = toolcalls.split('[TOOL_CALLS]');
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
}