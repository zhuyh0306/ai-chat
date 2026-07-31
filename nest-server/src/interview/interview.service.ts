import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewQuestion } from './entities/interview-question.entity';
import {
  CreateInterviewQuestionDto,
  UpdateInterviewQuestionDto,
  InterviewQueryDto,
} from './dto/interview-question.dto';
import { InterviewSearchDto } from './dto/interview-search.dto';

@Injectable()
export class InterviewService {
  constructor(
    @InjectRepository(InterviewQuestion)
    private readonly repo: Repository<InterviewQuestion>,
  ) {}

  async create(dto: CreateInterviewQuestionDto) {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(query: InterviewQueryDto) {
    const { keyword, category, subCategory, source } = query;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const qb = this.repo.createQueryBuilder('q');

    if (keyword) {
      qb.andWhere(
        '(q.question ILIKE :kw OR q.answer ILIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }
    if (category) {
      qb.andWhere('q.category = :category', { category });
    }
    if (subCategory) {
      qb.andWhere('q.sub_category = :subCategory', { subCategory });
    }
    if (source) {
      qb.andWhere('q.source ILIKE :source', { source: `%${source}%` });
    }

    const [items, total] = await qb
      .orderBy('q.source')
      .addOrderBy('q.category')
      .addOrderBy('q.sub_category')
      .addOrderBy('q.question_number')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`面试题不存在: ${id}`);
    }
    return entity;
  }

  async update(id: string, dto: UpdateInterviewQuestionDto) {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { id, deleted: true };
  }

  async bulkCreate(dtos: CreateInterviewQuestionDto[]) {
    if (!Array.isArray(dtos) || dtos.length === 0) {
      throw new BadRequestException('bulkCreate 需要非空数组');
    }
    const entities = this.repo.create(dtos);
    const saved = await this.repo.save(entities);
    return { count: saved.length, items: saved };
  }

  /**
   * 语义搜索：使用 pg_trgm 三元组相似度匹配
   * - similarity() 对中英文均有效，自动计算字符级相似度
   * - 结合 ILIKE 做兜底（精确子串匹配权重更高）
   * - 阈值默认 0.05，可过滤完全不相关结果
   */
  async search(dto: InterviewSearchDto) {
    const { q, category, source, topK = 5, threshold = 0.05 } = dto;

    const qb = this.repo.createQueryBuilder('q');

    // 选择列：计算综合相似度得分
    if (q && q.trim()) {
      qb.addSelect(
        `GREATEST(
          similarity(q.question, :query),
          similarity(q.answer, :query)
        )`,
        'score',
      );
      qb.setParameter('query', q.trim());

      // 相似度 > 阈值 OR ILIKE 兜底匹配
      qb.andWhere(
        `(similarity(q.question, :query) > :threshold
           OR similarity(q.answer, :query) > :threshold
           OR q.question ILIKE :kw
           OR q.answer ILIKE :kw)`,
        {
          query: q.trim(),
          threshold,
          kw: `%${q.trim()}%`,
        },
      );

      qb.orderBy('score', 'DESC');
    } else {
      // 无搜索词时按默认排序
      qb.addSelect('1', 'score');
      qb.orderBy('q.source').addOrderBy('q.category');
    }

    // 分类过滤
    if (category) {
      qb.andWhere('q.category = :category', { category });
    }

    // 来源过滤
    if (source) {
      qb.andWhere('q.source ILIKE :source', { source: `%${source}%` });
    }

    // 添加二级排序稳定性
    qb.addOrderBy('q.question_number');

    const items = await qb.limit(topK).getMany();

    return { items, total: items.length, query: q || null };
  }

  /**
   * 获取所有分类列表（供 Agent 了解可查询范围）
   */
  async getCategories() {
    const result = await this.repo
      .createQueryBuilder('q')
      .select('DISTINCT q.category', 'category')
      .addSelect('COUNT(q.id)', 'count')
      .where('q.category IS NOT NULL')
      .groupBy('q.category')
      .orderBy('count', 'DESC')
      .getRawMany();
    return result;
  }

  /**
   * 获取所有来源列表（供 Agent 了解可查询范围）
   */
  async getSources() {
    const result = await this.repo
      .createQueryBuilder('q')
      .select('DISTINCT q.source', 'source')
      .addSelect('COUNT(q.id)', 'count')
      .where('q.source IS NOT NULL')
      .groupBy('q.source')
      .orderBy('count', 'DESC')
      .getRawMany();
    return result;
  }
}
