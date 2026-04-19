import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateIntentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  inputToken: string;

  @IsString()
  @IsNotEmpty()
  outputToken: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  slippage: number;

  @IsNumber()
  deadline: number;

  @IsString()
  @IsNotEmpty()
  nonce: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  publicKey: string;
}
