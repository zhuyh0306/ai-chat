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
import { AuthGuard } from '@nestjs/passport';
import { ModelsService } from './models.service';
import { CreateModelDto, UpdateModelDto, ResetModelsDto } from './dto/model.dto';

@Controller('api/models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  findAll() {
    return this.modelsService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateModelDto) {
    return this.modelsService.create(dto);
  }

  @Put()
  @UseGuards(AuthGuard('jwt'))
  bulkSave(@Body() dto: ResetModelsDto) {
    return this.modelsService.bulkSave(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, @Body() dto: UpdateModelDto) {
    return this.modelsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.modelsService.remove(id);
  }
}
