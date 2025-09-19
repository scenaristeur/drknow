import OpenAI from 'openai';
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

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
    ]
}
)
// console.log(response)
console.log(response.choices[0].message.content)