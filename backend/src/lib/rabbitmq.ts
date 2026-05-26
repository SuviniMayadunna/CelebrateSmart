import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://celebratesmart:celebratesmart123@localhost:5672';
export const NOTIFICATIONS_QUEUE = 'celebratesmart.notifications';

export interface NotificationMessage {
  title:   string;
  content: string;
  emails:  string[];
  sentAt:  string;
}

// Lazy singleton connection
let _connection: amqp.ChannelModel | null = null;
let _channel:    amqp.Channel      | null = null;

async function getChannel(): Promise<amqp.Channel> {
  if (_channel) return _channel;

  _connection = await amqp.connect(RABBITMQ_URL);
  const ch    = await _connection.createChannel();
  await ch.assertQueue(NOTIFICATIONS_QUEUE, { durable: true });

  _connection.on('error', () => { _connection = null; _channel = null; });
  _connection.on('close', () => { _connection = null; _channel = null; });

  _channel = ch;
  console.log('[RabbitMQ] connected');
  return ch;
}

export async function publishNotification(msg: NotificationMessage): Promise<boolean> {
  try {
    const ch = await getChannel();
    return ch.sendToQueue(
      NOTIFICATIONS_QUEUE,
      Buffer.from(JSON.stringify(msg)),
      { persistent: true }
    );
  } catch (err) {
    console.error('[RabbitMQ] publish failed:', err);
    return false;
  }
}

export async function consumeNotifications(
  handler: (msg: NotificationMessage) => Promise<void>
): Promise<void> {
  const ch = await getChannel();
  await ch.prefetch(1);
  await ch.consume(NOTIFICATIONS_QUEUE, async (raw) => {
    if (!raw) return;
    try {
      const msg = JSON.parse(raw.content.toString()) as NotificationMessage;
      await handler(msg);
      ch.ack(raw);
    } catch (err) {
      console.error('[RabbitMQ] handler error:', err);
      ch.nack(raw, false, false);
    }
  });
  console.log('[RabbitMQ] consuming from', NOTIFICATIONS_QUEUE);
}

export async function closeRabbitMQ(): Promise<void> {
  try {
    await _channel?.close();
    await _connection?.close();
  } catch {
    // ignore close errors on shutdown
  } finally {
    _channel    = null;
    _connection = null;
  }
}
