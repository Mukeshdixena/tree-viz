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
    async getDisciplineInsights(context: {
        disciplineScore: number;
        subScores: { habitConsistency: number; plannerAdherence: number; streakScore: number; velocityScore: number };
        streak: number;
        failingHabits: { name: string; daysMissed: number }[];
        failingPlannerDays: { date: string; completion: number }[];
        stuckTasks: { title: string }[];
        totalHabits: number;
        completedThisWeek: number;
    }, userQuestion?: string) {
        const systemPrompt = `You are a strict, data-driven personal discipline coach. You have been given the user's behavioral data for the past 7 days.

USER METRICS:
- Overall Discipline Score: ${context.disciplineScore}/100
- Habit Consistency: ${context.subScores.habitConsistency}/100 (40% weight)
- Planner Adherence: ${context.subScores.plannerAdherence}/100 (30% weight)
- Streak Health: ${context.subScores.streakScore}/100 — Current streak: ${context.streak} days (20% weight)
- Task Velocity: ${context.subScores.velocityScore}/100 — Completed ${context.completedThisWeek} tasks this week (10% weight)

FAILING HABITS (0 completions in last 3 days):
${context.failingHabits.length > 0 ? context.failingHabits.map(h => `- ${h.name}`).join('\n') : '- None! Great job.'}

WEAK PLANNER DAYS (< 50% completion):
${context.failingPlannerDays.length > 0 ? context.failingPlannerDays.map(d => `- ${d.date}: ${d.completion}%`).join('\n') : '- None in the past 7 days.'}

STUCK TASKS (no update in 7+ days):
${context.stuckTasks.length > 0 ? context.stuckTasks.map(t => `- ${t.title}`).join('\n') : '- None.'}

COACHING STYLE:
- Be direct, specific, and brutally honest about failures.
- Always cite the actual data (scores, habit names, dates).
- Be encouraging but do not sugarcoat poor performance.
- Provide 1-3 concrete, actionable steps.
- Keep responses concise and punchy — this is a coaching dashboard, not an essay.
- If score > 70: celebrate but push for excellence.
- If score 40-70: identify the top 1-2 things dragging the score down.
- If score < 40: firm intervention tone, prioritize the single most critical habit to fix immediately.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuestion || 'Give me a quick honest assessment of my discipline this week and tell me exactly what I need to focus on today.' }
        ];

        const response = await this.chat(messages);
        return { content: response.content };
    }
}

