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
}
