import { ArgsType, Field } from '@nestjs/graphql';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@ArgsType()
export class SetCurrentUserPasswordInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
