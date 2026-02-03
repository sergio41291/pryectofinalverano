export class CategoryResponseDto {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sharedWithGroupId?: string;
  sharedWithGroup?: {
    id: string;
    name: string;
  };
  documentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
