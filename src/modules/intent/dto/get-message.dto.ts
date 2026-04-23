import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetMessageDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  nonce: string;

  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @IsString()
  @IsOptional()
  inputToken?: string;

  @IsString()
  @IsOptional()
  outputToken?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  amount?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  slippage?: number;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  timestamp?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  messageId?: number;
}
