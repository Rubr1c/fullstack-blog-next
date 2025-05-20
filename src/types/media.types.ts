import { type Media } from '@/generated/prisma';

export interface MediaDTO {
  id: string;
  url: string;
  caption: string | null;
  position: number;
  postId: string;
  uploadedAt: Date;
}

export function createMediaDto(media: Media): MediaDTO {
  return {
    id: media.id,
    url: media.url,
    caption: media.caption ?? null,
    position: media.position,
    postId: media.postId,
    uploadedAt: media.uploadedAt,
  };
}
