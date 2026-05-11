import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import s3Client from './minio';

const requiredBuckets = ['avatars', 'task-attachments'];

export async function initializeBuckets() {
  for (const bucket of requiredBuckets) {
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`Bucket '${bucket}' created or already exists.`);
    } catch (error: any) {
      if (error.name !== 'BucketAlreadyOwnedByYou') {
        console.error(`Error creating bucket ${bucket}:`, error);
      }
    }
  }
}