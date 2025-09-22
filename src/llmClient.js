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
        this.steps = []
        let validation = false
        let loops = this.loops
        while (this.steps.length < loops && !validation) {
            const step = this.steps.length
            console.log(step)
            let result = await this.ask(query, this.steps)
            validation = await this.validation(query, this.steps)



            this.steps.push({
                step: step,
                result: result,
                validation: validation
            })
        }
        let synthese = await this.synthese(query, this.steps)

        return JSON.stringify({ synthese: synthese, steps: this.steps })
    }

    async ask(query, steps) {
        return "reponse"
    }
    async validation(query, steps) {
        return Math.random() < 0.4
    }


    async synthese(query, steps) {
        return "synthese"
    }
}