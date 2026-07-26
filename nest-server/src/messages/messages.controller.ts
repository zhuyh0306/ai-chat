import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/message.dto';

@Controller('api/conversations/:convId/messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findByConversation(@Param('convId') convId: string) {
    return this.messagesService.findByConversation(convId);
  }

  @Post()
  create(@Param('convId') convId: string, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(convId, dto);
  }
}
