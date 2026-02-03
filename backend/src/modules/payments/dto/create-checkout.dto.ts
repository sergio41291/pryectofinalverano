import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum CheckoutTier {
  PRO = 'pro',
  BUSINESS = 'business',
}

export class CreateCheckoutDto {
  @IsEnum(CheckoutTier)
  @IsNotEmpty()
  tier: CheckoutTier;

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;
}
