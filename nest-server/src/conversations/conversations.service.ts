import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationDto } from './dto/conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
  ) {}

  async findAll(userId?: string): Promise<Conversation[]> {
    const where: any = {};
    if (userId) where.userId = userId;
    return this.convRepo.find({
      where,
      order: { updatedAt: 'DESC' },
    });
  }

  async create(dto: CreateConversationDto, userId?: string): Promise<Conversation> {
    const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const conv = this.convRepo.create({
      id,
      title: dto.title || '新对话',
      userId: userId || undefined,
    });
    return this.convRepo.save(conv);
  }

  async remove(id: string): Promise<void> {
    const result = await this.convRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('会话不存在');
    }
  }
}
