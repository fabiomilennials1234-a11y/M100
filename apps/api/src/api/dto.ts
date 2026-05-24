import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ConversationStatus, OwnerType, AgentAvailability } from '@motor100/shared';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class ReassignDto {
  @IsString()
  @IsNotEmpty()
  agentId!: string;
}

export class UpdateAvailabilityDto {
  @IsEnum(AgentAvailability)
  availability!: AgentAvailability;
}

export class ConversationFilterDto {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsEnum(OwnerType)
  ownerType?: OwnerType;

  @IsOptional()
  @IsString()
  agentId?: string;
}
