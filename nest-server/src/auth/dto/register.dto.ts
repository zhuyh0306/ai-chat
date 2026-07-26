import { IsString, MinLength, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'alice', minLength: 3, maxLength: 50, description: '用户名' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'alice@example.com', description: '邮箱' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret123', minLength: 6, maxLength: 100, description: '密码' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
