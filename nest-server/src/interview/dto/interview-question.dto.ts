import {
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInterviewQuestionDto {
  @ApiProperty({ description: '来源 PDF 文件名', example: '面试精选百题-前端v1.2.3.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  source: string;

  @ApiProperty({ description: '大分类', required: false, example: '前端基础三件套（HTML/CSS/JS）' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  category?: string;

  @ApiProperty({ description: '子分类', required: false, example: 'HTML' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subCategory?: string;

  @ApiProperty({ description: '题号', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  questionNumber?: number;

  @ApiProperty({ description: '题目' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: '参考答案' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ description: '标签', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateInterviewQuestionDto {
  @ApiProperty({ description: '大分类', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  category?: string;

  @ApiProperty({ description: '子分类', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subCategory?: string;

  @ApiProperty({ description: '题号', required: false })
  @IsOptional()
  @IsInt()
  questionNumber?: number;

  @ApiProperty({ description: '题目', required: false })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiProperty({ description: '参考答案', required: false })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiProperty({ description: '标签', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class InterviewQueryDto {
  @ApiProperty({ description: '按题目或答案关键字模糊搜索', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '按大分类过滤', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '按子分类过滤', required: false })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiProperty({ description: '按来源过滤', required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ description: '页码（从 1 开始）', required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 1)
  @IsInt()
  page?: number = 1;

  @ApiProperty({ description: '每页条数', required: false, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 20)
  @IsInt()
  pageSize?: number = 20;
}
