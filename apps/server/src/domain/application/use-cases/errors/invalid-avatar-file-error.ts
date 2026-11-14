export const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;

export class InvalidAvatarFileError extends Error {
  constructor(message = 'The avatar file is invalid.') {
    super(message);
  }
}
