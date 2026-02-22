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

    async generatePlan(prompt: string, currentPlan?: any) {
        const systemPrompt = `
            You are a productivity expert. Your task is to generate or refine a structured daily plan based on the user's input.
            
            ${currentPlan ? `
            The user already has a plan:
            Wake up: ${currentPlan.wakeUpTime || 'Not set'}
            Blocks: ${JSON.stringify(currentPlan.blocks.map((b: any) => ({ startTime: b.startTime, endTime: b.endTime, plan: b.plan, tag: b.tag })))}
            
            The user wants to update or refine this plan. Modify it according to their new request.
            ` : 'Generate a new daily schedule from scratch based on the user\'s description.'}

            Return a JSON object with the following structure:
            {
                "wakeUpTime": "HH:MM",
                "blocks": [
                    {
                        "startTime": "HH:MM",
                        "endTime": "HH:MM",
                        "plan": "Description of the task",
                        "tag": "one of: meditation, fitness, dsa, english, work, study, rest, family, none"
                    }
                ]
            }
            Ensure times are in 24-hour format (HH:MM). 
            Try to cover the entire day logically.
            Return ONLY the raw JSON object. Do not include any other text.
        `;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages);
        try {
            // Clean response content in case AI includes markdown code blocks
            const content = response.content.replace(/```json\n?|```/g, '').trim();
            return JSON.parse(content);
        } catch (e) {
            this.logger.error(`Failed to parse AI response: ${response.content}`);
            throw new Error("AI returned invalid JSON structure");
        }
    }

    async logProgress(plan: any, progressPrompt: string) {
        const systemPrompt = `
            You are a productivity tracker. The user has a planned schedule and is now describing what they actually did.
            Your task is to map their actual achievements to the planned time blocks.
            
            Planned Schedule:
            ${JSON.stringify(plan.blocks.map((b: any, i: number) => ({ index: i, startTime: b.startTime, endTime: b.endTime, plan: b.plan })))}
            
            Return a JSON object with the following structure:
            {
                "blocks": [
                    {
                        "index": number, // The index of the planned block (0-based)
                        "reality": "What actually happened",
                        "completed": number // Percentage (0-100)
                    }
                ]
            }
            If the user mentions something not in the plan, try to map it to the most relevant block or ignore if completely unrelated.
            Return ONLY the raw JSON object. Do not include any other text.
        `;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: progressPrompt }
        ];

        const response = await this.chat(messages);
        try {
            const content = response.content.replace(/```json\n?|```/g, '').trim();
            return JSON.parse(content);
        } catch (e) {
            this.logger.error(`Failed to parse AI response: ${response.content}`);
            throw new Error("AI returned invalid JSON structure");
        }
    }
}
