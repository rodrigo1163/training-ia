import {
  BadRequestException,
  Controller,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { fromNodeHeaders } from 'better-auth/node';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Request, Response } from 'express';
import {
  InvalidAvatarFileError,
  MAX_AVATAR_FILE_SIZE,
} from '@/domain/application/use-cases/avatar-image';
import { UploadUserAvatarUseCase } from '@/domain/application/use-cases/upload-user-avatar';

@Controller('account/avatar')
@UseInterceptors(
  FileInterceptor('file', {
    limits: { fileSize: MAX_AVATAR_FILE_SIZE, files: 1 },
  }),
)
export class UploadUserAvatarController {
  constructor(private readonly uploadAvatar: UploadUserAvatarUseCase) {}

  @Post()
  async handle(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Session() session: UserSession,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!file) throw new BadRequestException('Avatar file is required.');

    const result = await this.uploadAvatar.execute({
      body: file.buffer,
      fileType: file.mimetype,
      headers: fromNodeHeaders(request.headers),
      size: file.size,
      userId: session.user.id,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof InvalidAvatarFileError) {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException('Unable to upload the avatar.');
    }

    forwardSessionCookie(result.value.headers, response);

    return { imageUrl: result.value.imageUrl };
  }
}

function forwardSessionCookie(headers: Headers, response: Response): void {
  const cookies = headers.getSetCookie?.();
  if (cookies?.length) {
    response.setHeader('set-cookie', cookies);
    return;
  }

  const cookie = headers.get('set-cookie');
  if (cookie) response.setHeader('set-cookie', cookie);
}
