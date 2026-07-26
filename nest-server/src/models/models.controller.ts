import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ModelsService } from './models.service';
import { CreateModelDto, UpdateModelDto, ResetModelsDto } from './dto/model.dto';

@ApiTags('models')
@ApiBearerAuth('access-token')
@Controller('api/models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  @ApiOperation({ summary: '获取全部模型' })
  @ApiResponse({ status: 200, description: '模型列表' })
  findAll() {
    return this.modelsService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '新增单个模型（需鉴权）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() dto: CreateModelDto) {
    return this.modelsService.create(dto);
  }

  @Put()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '批量保存/重置模型列表（需鉴权）' })
  @ApiResponse({ status: 200, description: '保存成功' })
  bulkSave(@Body() dto: ResetModelsDto) {
    return this.modelsService.bulkSave(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '更新指定模型（需鉴权）' })
  @ApiParam({ name: 'id', description: '模型 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '模型不存在' })
  update(@Param('id') id: string, @Body() dto: UpdateModelDto) {
    return this.modelsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '删除指定模型（需鉴权）' })
  @ApiParam({ name: 'id', description: '模型 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '模型不存在' })
  remove(@Param('id') id: string) {
    return this.modelsService.remove(id);
  }
}
