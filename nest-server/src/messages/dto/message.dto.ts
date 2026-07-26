import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'], example: 'user', description: '消息角色' })
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ example: '你好', description: '消息内容' })
  @IsString()
  content: string;
}
