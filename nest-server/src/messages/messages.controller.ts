import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/message.dto';

@ApiTags('messages')
@ApiBearerAuth('access-token')
@Controller('api/conversations/:convId/messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: '获取某会话下的全部消息（需鉴权）' })
  @ApiParam({ name: 'convId', description: '会话 ID' })
  @ApiResponse({ status: 200, description: '消息列表' })
  findByConversation(@Param('convId') convId: string) {
    return this.messagesService.findByConversation(convId);
  }

  @Post()
  @ApiOperation({ summary: '向会话追加一条消息（需鉴权）' })
  @ApiParam({ name: 'convId', description: '会话 ID' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Param('convId') convId: string, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(convId, dto);
  }
}
