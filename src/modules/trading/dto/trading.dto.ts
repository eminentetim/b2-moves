import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateLimitOrderDto {
  @IsString()
  inputToken: string;

  @IsString()
  outputToken: string;

  @IsNumber()
  amountIn: number;

  @IsNumber()
  triggerPrice: number;

  @IsString()
  userId: string;
}

export class CreateDcaOrderDto {
  @IsString()
  fromToken: string;

  @IsString()
  toToken: string;

  @IsNumber()
  amount: number;

  @IsString()
  frequency: string; // 'daily', 'weekly', 'monthly'

  @IsString()
  userId: string;
}

export class UpdatePositionDto {
  @IsString()
  tokenMint: string;

  @IsNumber()
  @IsOptional()
  takeProfitPrice?: number;

  @IsNumber()
  @IsOptional()
  stopLossPrice?: number;

  @IsString()
  userId: string;
}
