import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JournalService } from './journal.service';
import { JournalController } from './journal.controller';
import { Journal, JournalSchema } from './schemas/journal.schema';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Journal.name, schema: JournalSchema }]),
    GatewayModule,
  ],
  controllers: [JournalController],
  providers: [JournalService],
})
export class JournalModule { }
