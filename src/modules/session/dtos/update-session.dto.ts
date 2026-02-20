import 
{
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsIn,
} from 'class-validator';

export type SessionStatus = 'active' | 'ended' | 'revoked';

/**
 * DTO para actualizar parcialmente un Session.
 * Igual que CreateSessionDto pero todos los campos son opcionales.
 */
export class UpdateSessionDto 
{
  @IsOptional()
  @IsUUID('4', { message: 'customer_id debe ser un UUID válido' })
  customer_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ip_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  user_agent?: string;

  @IsOptional()
  @IsIn(['active', 'ended', 'revoked'])
  status?: SessionStatus;
}