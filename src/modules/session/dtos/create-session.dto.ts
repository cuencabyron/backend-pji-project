import 
{
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsIn,
} from 'class-validator';

export type SessionStatus = 'active' | 'ended' | 'revoked';

/**
 * DTO para crear una nueva Session.
 * Representa la forma del body en POST /api/sessions.
 */
export class CreateSessionDto 
{
  @IsUUID('4', { message: 'customer_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'customer_id es obligatorio' })
  customer_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'ip_address es obligatorio' })
  @MaxLength(45, { message: 'ip_address no debe superar 45 caracteres' })
  ip_address!: string;

  @IsString()
  @IsNotEmpty({ message: 'user_agent es obligatorio' })
  @MaxLength(255, { message: 'user_agent no debe superar 255 caracteres' })
  user_agent!: string;

  @IsOptional()
  @IsIn(['active', 'ended', 'revoked'], {
    message: 'status debe ser active, ended o revoked',
  })
  status?: SessionStatus;
}
