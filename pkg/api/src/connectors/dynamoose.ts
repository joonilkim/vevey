import * as dynamoose from 'dynamoose'

if(process.env.DYNAMODB_ENDPOINT) {
  dynamoose.AWS.config.update({
    region: 'localhost'
  })
  dynamoose.local(process.env.DYNAMODB_ENDPOINT)
}

dynamoose.setDefaults({
  create: process.env.NODE_ENV !== 'production',
  prefix: process.env.DYNAMODB_PREFIX,
})

export default dynamoose
