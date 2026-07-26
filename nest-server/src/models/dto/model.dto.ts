import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModelDto {
  @ApiProperty({ example: 'gpt-4o', description: '模型 ID' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'GPT-4o', description: '模型名称' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'openai', description: '模型提供商' })
  @IsString()
  provider: string;
}

export class UpdateModelDto {
  @ApiProperty({ example: 'GPT-4o-mini', description: '模型名称' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'openai', description: '模型提供商' })
  @IsString()
  provider: string;
}

export class ResetModelsDto {
  @ApiPropertyOptional({ description: '是否重置为默认列表' })
  @IsOptional()
  reset?: boolean;

  @ApiPropertyOptional({ type: [CreateModelDto], description: '要保存的模型列表' })
  @IsOptional()
  models?: CreateModelDto[];
}
