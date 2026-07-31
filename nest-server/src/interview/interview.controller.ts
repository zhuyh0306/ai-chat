import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { InterviewService } from './interview.service';
import {
  CreateInterviewQuestionDto,
  UpdateInterviewQuestionDto,
  InterviewQueryDto,
} from './dto/interview-question.dto';
import { InterviewSearchDto } from './dto/interview-search.dto';

@ApiTags('interview')
@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post()
  @ApiOperation({ summary: '新增一道面试题' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() dto: CreateInterviewQuestionDto) {
    return this.interviewService.create(dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: '批量新增面试题' })
  bulkCreate(@Body() dtos: CreateInterviewQuestionDto[]) {
    return this.interviewService.bulkCreate(dtos);
  }

  // ── 精确路由（必须在 :id 之前） ──

  @Get('search')
  @ApiOperation({
    summary: '语义搜索面试题（pg_trgm trigram 相似度 + ILIKE 兜底）',
    description:
      '使用 pg_trgm 的 similarity() 函数进行中英文混合语义检索，比 ILIKE 命中率高得多。' +
      '支持按分类/来源过滤，返回 topK 条最相似结果。',
  })
  search(@Query() dto: InterviewSearchDto) {
    return this.interviewService.search(dto);
  }

  @Get('meta/categories')
  @ApiOperation({ summary: '获取所有分类及其题数（供 Agent 了解数据范围）' })
  getCategories() {
    return this.interviewService.getCategories();
  }

  @Get('meta/sources')
  @ApiOperation({ summary: '获取所有来源及其题数' })
  getSources() {
    return this.interviewService.getSources();
  }

  // ── 参数化路由 ──

  @Get()
  @ApiOperation({ summary: '分页 + 条件查询面试题（支持关键字/分类/子分类/来源）' })
  findAll(@Query() query: InterviewQueryDto) {
    return this.interviewService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '按 ID 获取单道面试题' })
  @ApiParam({ name: 'id', description: '面试题 UUID' })
  findOne(@Param('id') id: string) {
    return this.interviewService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新一道面试题' })
  @ApiParam({ name: 'id', description: '面试题 UUID' })
  update(@Param('id') id: string, @Body() dto: UpdateInterviewQuestionDto) {
    return this.interviewService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除一道面试题' })
  @ApiParam({ name: 'id', description: '面试题 UUID' })
  remove(@Param('id') id: string) {
    return this.interviewService.remove(id);
  }
}
