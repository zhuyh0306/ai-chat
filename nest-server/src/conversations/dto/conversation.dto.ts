import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: '新对话', description: '会话标题（可选）' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  title?: string;
}
