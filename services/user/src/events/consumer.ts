import amqp from "amqplib";
import createUserProfile from "../utils/createUserProfile";
import "dotenv/config";
import PublishedUser from "../interfaces/PublishedUser";

export async function listenForUserEvents() {
    const conn = await amqp.connect(process.env.RABBITMQ_URL as string);
    const channel = await conn.createChannel();
    const exchange = "user";

    await channel.assertExchange(exchange, "topic", { durable: true });

    const q = await channel.assertQueue("", { exclusive: true });

    await channel.bindQueue(q.queue, exchange, "user.created");

    channel.consume(q.queue, async (msg) => {
        if (msg !== null) {
            const data: PublishedUser = JSON.parse(msg.content.toString());
            await createUserProfile(data);
            channel.ack(msg);
        }
    });
}
