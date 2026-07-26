import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
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
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/conversation.dto';

@ApiTags('conversations')
@ApiBearerAuth('access-token')
@Controller('api/conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '获取当前用户的所有会话（需鉴权）' })
  @ApiResponse({ status: 200, description: '会话列表' })
  findAll(@Req() req: any) {
    return this.conversationsService.findAll(req.user?.id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '创建新会话（需鉴权）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() dto: CreateConversationDto, @Req() req: any) {
    return this.conversationsService.create(dto, req.user?.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '删除会话（需鉴权）' })
  @ApiParam({ name: 'id', description: '会话 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(id);
  }
}
