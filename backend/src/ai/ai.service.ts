import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private openai: OpenAI;
    private readonly logger = new Logger(AiService.name);

    constructor() {
        const apiKey = process.env.AI_API_KEY;
        this.logger.log(`Initializing AI Service. API Key present: ${!!apiKey}`);

        if (!apiKey) {
            this.logger.warn('AI_API_KEY is missing from environment variables!');
        }

        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key',
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': 'https://github.com/Mukeshdixena/tree-viz',
                'X-Title': 'Tree-Viz AI Chatbot',
            }
        });
    }

    async chat(messages: any[]) {
        try {
            this.logger.log(`Sending chat request with ${messages.length} messages`);
            const completion = await this.openai.chat.completions.create({
                model: 'openrouter/free',
                messages: messages.map(m => ({ role: m.role, content: m.content })),
            });

            if (!completion.choices || completion.choices.length === 0) {
                throw new Error('No completion choices returned from AI');
            }

            return completion.choices[0].message;
        } catch (error) {
            this.logger.error(`Error in AiService.chat: ${error.message}`);
            if (error.response) {
                this.logger.error(`AI API Response: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
}
