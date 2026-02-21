const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.AI_API_KEY;
console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) : 'MISSING');

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'HTTP-Referer': 'https://github.com/Mukeshdixena/tree-viz',
        'X-Title': 'Tree-Viz Debug',
    }
});

async function test() {
    try {
        console.log('Sending request to OpenRouter...');
        const completion = await openai.chat.completions.create({
            model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
            messages: [{ role: 'user', content: 'Say "Connection successful"' }],
        });
        console.log('Response:', JSON.stringify(completion.choices[0].message, null, 2));
    } catch (error) {
        console.error('Error details:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    }
}

test();
