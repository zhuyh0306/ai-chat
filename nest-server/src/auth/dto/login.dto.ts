import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'alice', description: '用户名' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'secret123', description: '密码' })
  @IsString()
  password: string;
}
