import { IsString, IsIn } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}
