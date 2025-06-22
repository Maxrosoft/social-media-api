import { Client } from "minio";

const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT as string,
    port: Number(process.env.MINIO_PORT) as number,
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER as string,
    secretKey: process.env.MINIO_ROOT_PASSWORD as string,
});

export default minioClient;
