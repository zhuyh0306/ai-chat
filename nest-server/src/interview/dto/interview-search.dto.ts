import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InterviewSearchDto {
  @ApiProperty({
    description: '搜索查询（用户的问题/关键词），使用 trigram 语义相似度匹配',
    required: false,
    example: 'React hooks 原理',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ description: '按大分类过滤', required: false, example: '前端核心' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '按来源过滤', required: false, example: '基础篇' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ description: '返回数量', required: false, default: 5 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 5)
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number = 5;

  @ApiProperty({ description: '最低相似度阈值 (0-1)', required: false, default: 0.05 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value) || 0.05)
  threshold?: number = 0.05;
}
