import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateIntentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  inputToken?: string;

  @IsString()
  @IsOptional()
  outputToken?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsNumber()
  @IsOptional()
  slippage?: number;

  @IsNumber()
  @IsOptional()
  deadline?: number;

  @IsString()
  @IsNotEmpty()
  nonce: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  intentId?: string;

  @IsString()
  @IsOptional()
  timestamp?: string;

  @IsNumber()
  @IsOptional()
  messageId?: number;

  // Trading specific fields (Limit Order)
  @IsNumber()
  @IsOptional()
  amountIn?: number;

  @IsNumber()
  @IsOptional()
  triggerPrice?: number;

  // DCA specific fields
  @IsString()
  @IsOptional()
  fromToken?: string;

  @IsString()
  @IsOptional()
  toToken?: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  // TP/SL specific fields
  @IsString()
  @IsOptional()
  tokenMint?: string;

  @IsNumber()
  @IsOptional()
  takeProfitPrice?: number;

  @IsNumber()
  @IsOptional()
  stopLossPrice?: number;
}
