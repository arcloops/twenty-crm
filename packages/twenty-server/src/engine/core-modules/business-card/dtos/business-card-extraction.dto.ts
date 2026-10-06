import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('BusinessCardExtraction')
export class BusinessCardExtractionDTO {
  @Field(() => String, { nullable: true })
  firstName: string | null;

  @Field(() => String, { nullable: true })
  lastName: string | null;

  @Field(() => String, { nullable: true })
  jobTitle: string | null;

  @Field(() => [String])
  emails: string[];

  @Field(() => [String])
  phones: string[];

  @Field(() => String, { nullable: true })
  website: string | null;

  @Field(() => String, { nullable: true })
  companyName: string | null;

  @Field(() => String, { nullable: true })
  companyId: string | null;

  @Field(() => String)
  rawText: string;

  @Field(() => [String])
  warnings: string[];

  // First scanned file (front); kept for older clients
  @Field(() => String)
  fileId: string;

  @Field(() => [String])
  fileIds: string[];
}
