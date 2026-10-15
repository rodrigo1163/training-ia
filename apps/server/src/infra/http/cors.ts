import type { INestApplication } from '@nestjs/common';
import type { CorsOptionsDelegate } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { Request } from 'express';

export function configureCors(app: INestApplication, panelOrigin: string) {
  const delegate: CorsOptionsDelegate<Request> = (request, callback) => {
    const isPublicChat = request.url.startsWith('/public/chat/');
    callback(null, {
      origin: isPublicChat ? true : panelOrigin,
      credentials: !isPublicChat,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  };
  app.enableCors(delegate);
}
