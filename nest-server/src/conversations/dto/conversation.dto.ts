import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  title?: string;
}
