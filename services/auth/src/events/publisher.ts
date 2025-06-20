import amqp from "amqplib";
import "dotenv/config";

export async function publishUserCreatedEvent(userData: any) {
    const conn = await amqp.connect(process.env.RABBITMQ_URL as string);
    const channel = await conn.createChannel();
    const exchange = "user";

    await channel.assertExchange(exchange, "topic", { durable: true });

    channel.publish(exchange, "user.created", Buffer.from(JSON.stringify(userData)));

    setTimeout(() => {
        channel.close();
        conn.close();
    }, 500);
}
