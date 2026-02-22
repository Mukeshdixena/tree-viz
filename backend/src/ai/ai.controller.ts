import { Controller, Post, Body, InternalServerErrorException, Logger } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    private readonly logger = new Logger(AiController.name);
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async chat(@Body('messages') messages: any[]) {
        try {
            if (!messages || !Array.isArray(messages)) {
                throw new Error('Invalid messages format: expected an array.');
            }
            return await this.aiService.chat(messages);
        } catch (error) {
            this.logger.error(`AI Chat failed: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message || 'AI Service Error');
        }
    }

    @Post('generate-plan')
    async generatePlan(@Body('prompt') prompt: string, @Body('currentPlan') currentPlan?: any) {
        try {
            if (!prompt) throw new Error('Prompt is required');
            return await this.aiService.generatePlan(prompt, currentPlan);
        } catch (error) {
            this.logger.error(`AI Generate Plan failed: ${error.message}`);
            throw new InternalServerErrorException(error.message || 'AI Service Error');
        }
    }

    @Post('log-progress')
    async logProgress(@Body('plan') plan: any, @Body('prompt') prompt: string) {
        try {
            if (!plan || !prompt) throw new Error('Plan and prompt are required');
            return await this.aiService.logProgress(plan, prompt);
        } catch (error) {
            this.logger.error(`AI Log Progress failed: ${error.message}`);
            throw new InternalServerErrorException(error.message || 'AI Service Error');
        }
    }
}
