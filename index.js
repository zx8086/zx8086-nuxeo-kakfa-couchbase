const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');

const usedUUIDs = new Set();

async function generateUUIDs(totalCount, usedPercentage) {
  const usedCount = Math.floor(totalCount * usedPercentage);
  const newCount = totalCount - usedCount;

  const existingUUIDs = await redisClient.srandmember('used_uuids', usedCount);
  existingUUIDs.forEach((uuid) => usedUUIDs.add(uuid));

  const newUUIDs = Array.from({ length: newCount }, () => uuidv4());
  await redisClient.sadd('used_uuids', newUUIDs);

  return [...existingUUIDs, ...newUUIDs];
}

async function produceMessages(topic, numMessages) {
  const kafka = new Kafka({
    clientId: 'nuxeo-system',
    brokers: ['localhost:9092'] // Replace with your Kafka brokers
  });

  const producer = kafka.producer();

  await producer.connect();

  for (let i = 0; i < numMessages; i++) {
    const uuids = await generateUUIDs(numMessages, 0.3);

    const nuxeoId = uuids[i];
    const status = usedUUIDs.has(nuxeoId) ? 'Updated' : 'Created';

    const message = {
      Status: status,
      Nuxeo_ID: nuxeoId,
      Modified: 1686673841,
      DivisionName: '62',
      SeasonName: 'C41',
      Position: 1,
      Title: 'Commercial Look 4',
      MarketLaunchContentTyp: 4,
      RelatedStyles: ['OPTION_62_C41_J20J223112YAF', 'OPTION_62_C41_J20J223112000'],
      Created: 1686042866,
      Scene7: 'http://s7g10.scene7.com/is/image/TommyHilfigerEU/SP24_CKJ_CL_W_COL_SINGLE_LOOK22_02',
      Brand: 'CK',
      FreeTag: 'Single Images - Women - Commercial Look - 4',
      'Asset Type': 'market_launch_content'
    };

    await producer.send({
      topic: topic,
      messages: [{ value: JSON.stringify(message) }]
    });
  }

  await producer.disconnect();
}

// Usage example
const topic = 'T-PRIVATE-NUXEO-LOOKS-SIMON'; // Replace with your Kafka topic name
const numMessages = 1000; // Number of messages to send

const redisClient = new Redis(); // Connect to Redis, assuming it's running locally

produceMessages(topic, numMessages)
  .then(() => {
    console.log('Messages sent successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error producing messages:', error);
    process.exit(1);
  });

//   docker exec broker kafka-topics --bootstrap-server broker:9092  --create  --topic T_PRIVATE_NUXEO-LOOKS
// docker exec --interactive --tty broker kafka-console-consumer --bootstrap-server broker:9092 --topic T-PRIVATE-NUXEO-LOOKS --from-beginning