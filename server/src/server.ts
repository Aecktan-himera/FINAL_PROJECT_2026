import app from './app';
import { initializeBuckets } from './lib/createBuckets';

const start = async () => {
  try {
    // Инициализируем бакеты MinIO (если MinIO недоступен – сервер всё равно запустится)
    await initializeBuckets().catch((err) => {
      console.warn('MinIO bucket initialization failed:', err.message);
      // не прерываем запуск сервера
    });
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on port 3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();