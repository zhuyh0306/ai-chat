import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewQuestion } from './entities/interview-question.entity';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InterviewQuestion])],
  controllers: [InterviewController],
  providers: [InterviewService],
})
export class InterviewModule {}
