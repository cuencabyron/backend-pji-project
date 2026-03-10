import {
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
  IsNumberString,
} from 'class-validator';

/**
 * DTO para actualizar parcialmente un Product.
 */
export class UpdateProductDto 
{
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsNumberString()
  min_monthly_rent?: string;

  @IsOptional()
  @IsNumberString()
  max_monthly_rent?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}