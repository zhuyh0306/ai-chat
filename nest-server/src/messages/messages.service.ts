import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly msgRepo: Repository<Message>,
  ) {}

  async findByConversation(conversationId: string): Promise<{ messages: Message[] }> {
    const msgs = await this.msgRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
    return { messages: msgs };
  }

  async create(conversationId: string, dto: CreateMessageDto): Promise<{ messages: Message[] }> {
    const msg = this.msgRepo.create({
      conversationId,
      role: dto.role,
      content: dto.content,
    });
    await this.msgRepo.save(msg);
    return this.findByConversation(conversationId);
  }
}
