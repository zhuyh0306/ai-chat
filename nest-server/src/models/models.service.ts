import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelConfig } from './entities/model-config.entity';
import { CreateModelDto, UpdateModelDto, ResetModelsDto } from './dto/model.dto';

const DEFAULT_MODELS: CreateModelDto[] = [
  { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'alibaba-cn' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'alibaba-cn' },
  { id: 'qwen3-235b-a22b', name: 'Qwen3 235B', provider: 'alibaba-cn' },
  { id: 'qwen-plus', name: 'Qwen Plus', provider: 'alibaba-cn' },
];

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(ModelConfig)
    private readonly modelRepo: Repository<ModelConfig>,
  ) {}

  async findAll(): Promise<ModelConfig[]> {
    const models = await this.modelRepo.find({ order: { name: 'ASC' } });
    if (models.length === 0) {
      await this.seedDefaults();
      return this.modelRepo.find({ order: { name: 'ASC' } });
    }
    return models;
  }

  async create(dto: CreateModelDto): Promise<ModelConfig[]> {
    const existing = await this.modelRepo.findOne({ where: { id: dto.id } });
    if (existing) {
      throw new ConflictException(`模型 ID "${dto.id}" 已存在`);
    }
    const model = this.modelRepo.create(dto);
    await this.modelRepo.save(model);
    return this.findAll();
  }

  async update(id: string, dto: UpdateModelDto): Promise<ModelConfig[]> {
    const model = await this.modelRepo.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException(`模型 "${id}" 不存在`);
    }
    model.name = dto.name;
    model.provider = dto.provider;
    await this.modelRepo.save(model);
    return this.findAll();
  }

  async remove(id: string): Promise<ModelConfig[]> {
    const result = await this.modelRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`模型 "${id}" 不存在`);
    }
    return this.findAll();
  }

  async reset(): Promise<ModelConfig[]> {
    await this.modelRepo.clear();
    const entities = this.modelRepo.create(DEFAULT_MODELS);
    await this.modelRepo.save(entities);
    return this.findAll();
  }

  async bulkSave(dto: ResetModelsDto): Promise<ModelConfig[]> {
    if (dto.reset) {
      return this.reset();
    }
    if (dto.models?.length) {
      await this.modelRepo.clear();
      const entities = this.modelRepo.create(dto.models);
      await this.modelRepo.save(entities);
    }
    return this.findAll();
  }

  private async seedDefaults(): Promise<void> {
    const entities = this.modelRepo.create(DEFAULT_MODELS);
    await this.modelRepo.save(entities);
  }
}
