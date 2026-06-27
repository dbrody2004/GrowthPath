const replacements = [
  [/mongodb:\/\/([^@\s/]*@)?127\.0\.0\.1:27118/g, 'mongodb://$1mongo:27017'],
  [/mongodb:\/\/([^@\s/]*@)?localhost:27118/g, 'mongodb://$1mongo:27017'],
  [/amqp:\/\/([^@\s/]*@)?127\.0\.0\.1:5674/g, 'amqp://$1rabbitmq:5672'],
  [/amqp:\/\/([^@\s/]*@)?localhost:5674/g, 'amqp://$1rabbitmq:5672'],
  [/http:\/\/127\.0\.0\.1:9004/g, 'http://minio:9000'],
  [/http:\/\/localhost:9004/g, 'http://minio:9000'],
];

export function rewriteProdUris(content) {
  return replacements.reduce((result, [pattern, value]) => result.replace(pattern, value), content);
}
