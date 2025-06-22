import minioClient from "../config/minio";

export async function initMinioBucket(bucket: string) {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
        await minioClient.makeBucket(bucket, "us-east-1");
        console.log(`Bucket ${bucket} created`);
    }
}
