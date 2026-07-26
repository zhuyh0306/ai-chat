import { IsString, IsOptional } from 'class-validator';

export class CreateModelDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  provider: string;
}

export class UpdateModelDto {
  @IsString()
  name: string;

  @IsString()
  provider: string;
}

export class ResetModelsDto {
  @IsOptional()
  reset?: boolean;

  @IsOptional()
  models?: CreateModelDto[];
}
