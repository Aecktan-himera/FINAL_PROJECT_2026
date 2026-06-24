import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../../lib/minio';
import prisma from '../../lib/prisma';

const avatarRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/avatar', {
    preValidation: app.authenticate,
  }, async (req, reply) => {
    const userId = req.user!.sub;

    // Получаем файл из запроса
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ message: 'No file uploaded' });
    }

    // Проверяем тип файла
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(data.mimetype)) {
      return reply.status(400).send({ message: 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP' });
    }

    // Читаем файл в буфер
    const buffer = await data.toBuffer();

    // Генерируем уникальное имя
    const ext = extname(data.filename);
    const filename = `${randomUUID()}${ext}`;
    const bucket = 'avatars';

    // Загружаем в MinIO
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: buffer,
        ContentType: data.mimetype,
        // ACL: 'public-read', // если бакет публичный
      }));
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ message: 'Failed to upload avatar' });
    }

    // Формируем URL для доступа к файлу
    // Используем переменную окружения MINIO_PUBLIC_URL, если задана, иначе строим из MINIO_ENDPOINT
    const publicUrl = process.env.MINIO_PUBLIC_URL
      ? `${process.env.MINIO_PUBLIC_URL}/${bucket}/${filename}`
      : `${process.env.MINIO_ENDPOINT}/${bucket}/${filename}`;

    // Обновляем запись пользователя в БД
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        firstName: true,
        surname: true,
        location: true,
        bio: true,
        settings: true,
        createdAt: true,
        specialization: true,
        skills: true,
      },
    });

    return { avatarUrl: updatedUser.avatarUrl };
  });
};

export default avatarRoute;