import { HttpError, HttpStatus } from '@/lib/errors';
import { getMediaById, getMediaByPostId } from './media.repository';
import { getPostById } from '../post/post.repository';
import { prisma } from '@/lib/prisma';
import { type MediaDTO, createMediaDto } from '@/types/media.types';
import type {
  CreateMediaInput,
  UpdateMediaInput,
} from '@/schemas/media.schema';

export async function addMediaToPost(
  input: CreateMediaInput,
  userId: bigint
): Promise<MediaDTO> {
  const post = await getPostById(input.postId);

  if (!post) {
    throw new HttpError(
      `Post with id ${input.postId} not found, cannot add media.`,
      HttpStatus.NOT_FOUND
    );
  }

  if (post.authorId !== userId) {
    throw new HttpError(
      'User is not authorized to add media to this post',
      HttpStatus.UNAUTHORIZED
    );
  }

  const media = await prisma.media.create({ data: input });
  return createMediaDto(media);
}

export async function fetchMediaItemById(id: string): Promise<MediaDTO> {
  const media = await getMediaById(id);
  if (!media) {
    throw new HttpError(`Media with id ${id} not found`, HttpStatus.NOT_FOUND);
  }
  return createMediaDto(media);
}

export async function fetchMediaForPost(postId: string): Promise<MediaDTO[]> {
  const mediaItems = await getMediaByPostId(postId);
  return mediaItems.map(createMediaDto);
}

export async function updateExistingMediaItem(
  mediaId: string,
  input: UpdateMediaInput,
  userId: bigint
): Promise<MediaDTO> {
  const existingMedia = await getMediaById(mediaId);

  if (!existingMedia) {
    throw new HttpError(
      `Media with id ${mediaId} not found`,
      HttpStatus.NOT_FOUND
    );
  }

  const post = await getPostById(existingMedia.postId);
  if (!post || post.authorId !== userId) {
    throw new HttpError(
      'User is not authorized to update media for this post',
      HttpStatus.UNAUTHORIZED
    );
  }

  const updatedMedia = await prisma.media.update({
    where: { id: mediaId },
    data: input,
  });
  return createMediaDto(updatedMedia);
}

export async function removeMediaItem(
  mediaId: string,
  userId: bigint
): Promise<MediaDTO> {
  const existingMedia = await getMediaById(mediaId);

  if (!existingMedia) {
    throw new HttpError(
      `Media with id ${mediaId} not found`,
      HttpStatus.NOT_FOUND
    );
  }

  const post = await getPostById(existingMedia.postId);
  if (!post || post.authorId !== userId) {
    throw new HttpError(
      'User is not authorized to delete media from this post',
      HttpStatus.UNAUTHORIZED
    );
  }

  const deletedMedia = await prisma.media.delete({
    where: { id: mediaId },
  });
  return createMediaDto(deletedMedia);
}
