import dotenv from 'dotenv'
import OpenAI from 'openai';
import extractToolCalls from './utils/extractToolCalls.js';

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
        this.loops = 5
        this.steps = []
    }

    async processQuery(query) {


        // let response = await this.ask(query, /*this.steps*/)
        // let validation = await this.validation(query, response/*, this.steps*/)

        // console.log("result", response)
        // console.log("validation", validation)
        this.steps = []
        let validation = false
        let loops = this.loops
        while (this.steps.length < loops && !(validation === 'true')) {
            console.log("valid ", validation)
            let steps_string = JSON.stringify(this.steps)
            let response = await this.ask(query + "\n" + steps_string, /*this.steps*/)
            validation = await this.validation(query + "\n" + steps_string, response/*, this.steps*/)
            const step = this.steps.length
            console.log(step)
            //     let result = await this.ask(query, this.steps)
            //     validation = await this.validation(query, this.steps)

            this.steps.push({
                step: step,
                response: response,
                validation: validation
            })
        }
        let synthese = await this.synthese(query, JSON.stringify(this.steps))

        this.messages.push(
            {
                role: "user",
                content: query,
            })

        this.messages.push(
            {
                role: "assistant",
                content: synthese,
            })

        console.log(synthese)
        // return JSON.stringify({ synthese: synthese, steps: this.steps })
    }

    async ask(query) {
        let messages = this.messages
        messages.push(
            {
                role: "user",
                content: query,
            })

        const response = await this.client.chat.completions.create({
            model: process.env['MODEL'],
            // max_tokens: 1000,
            messages: messages,
            tools: this.tools,
            // tool_choice: "auto"
        });
        console.log("tokens", response.usage.total_tokens)
        // console.log("usage", response.usage.details)
        // console.log(response.choices[0].message.content)
        let msg = response.choices[0].message
        // console.log("ask reponse", msg)
        let result = await this.toolUsage(msg.content)
        return result
    }
    async validation(query, reponse) {
        // return Math.random() < 0.4
        let consigne = `Ta mission est de vérifier les réponse d'un assistant intelligent llm.\
             Tu dois determiner si sa dernière réponse correspond à la demande de l'utilisateur.\
             répond seulement par un boolean js : true ou false.
             - la demande : ${query + "\n"}
             - la reponse : ${reponse + "\n"}
             Alors? true ou false?`
        //       Si c'est false, tu peux faire une suggestion.        ta réponse doit être sous la forme "{validation: true}" ou {validation: false, suggestion: "on devrait peut-être essayer de..."}

        let validation_messages = [] //this.messages
        // validation_messages.push({
        //     role: "assistant",
        //     content: reponse,
        // })
        validation_messages.push({
            role: "user",
            content: consigne,
        })

        // console.log(validation_messages)
        const response = await this.client.chat.completions.create({
            model: process.env['MODEL'],
            // max_tokens: 1000,
            messages: validation_messages,
            // tools: this.tools,
            // tool_choice: "auto"
        });
        // console.log(response.choices[0].message.content)
        let msg = response.choices[0].message
        // console.log("validation reponse", msg)
        // let result = await this.toolUsage(msg.content)
        return msg.content
    }


    async synthese(query, steps) {
        let consigne = `Ta mission est de synthétiser les etapes par rapport à la demande pour fournir une réponse cohérente.
             - la demande : ${query + "\n"}
             - les étapes : ${steps + "\n"}
        Donne la réponse attendue par l'utilisateur dans un format clair et concis.`
        //       Si c'est false, tu peux faire une suggestion.        ta réponse doit être sous la forme "{validation: true}" ou {validation: false, suggestion: "on devrait peut-être essayer de..."}

        let synthese_messages = [] //this.messages
        // validation_messages.push({
        //     role: "assistant",
        //     content: reponse,
        // })
        synthese_messages.push({
            role: "user",
            content: consigne,
        })

        // console.log(synthese_messages)
        const response = await this.client.chat.completions.create({
            model: process.env['MODEL_SMALL'],
            // max_tokens: 1000,
            messages: synthese_messages,
            // tools: this.tools,
            // tool_choice: "auto"
        });
        // console.log(response.choices[0].message.content)
        let msg = response.choices[0].message
        // console.log("synthese reponse", msg)
        return msg.content
    }
    log_messages() {
        console.log(this.messages)
    }

    async toolUsage(content) {
        let calls = extractToolCalls(content)
        console.log("\nCALLS", calls)
        let results = []
        for await (const call_tool of calls) {
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
                console.log(`[Calling tool ${call_tool.toolName} with args ${JSON.stringify(call_tool.toolArgs)}]`
                )
                console.log("RESULT:", result)
                results.push({
                    toolName: call_tool.toolName,
                    toolArgs: call_tool.toolArgs,
                    result: JSON.stringify(result.content[0].text)
                }
                )

                // this.messages.push({
                //     role: "user",
                //     content: result.content[0].text,
                // });
            } else {
                results.push(" !!Pas de tool nommé __", call_tool.toolName + "__")

            }

        }
        return JSON.stringify(results)
        // console.log("THIS MESSAAGES TO SEND : ", this.messages)

        //         const response_after = await this.client.chat.completions.create({
        //             model: process.env['MODEL'],
        //             // max_tokens: 1000,
        //             messages: this.messages,
        //             // tools: this.tools
        //         });
        //         let response_after_result = response_after.choices[0].message.content
        //         // console.log(response_after.choices[0])
        // return response_after_result
    }
}