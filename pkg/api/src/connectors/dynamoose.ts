import * as db from 'dynamoose'

if(process.env.NODE_ENV === 'test' &&
    !process.env.DYNAMODB_ENDPOINT) {
  throw new Error('Test against remote dynamodb is not allowed.')
}

if(process.env.DYNAMODB_ENDPOINT) {
  db.AWS.config.update({
    region: 'localhost'
  })
  db.local(process.env.DYNAMODB_ENDPOINT)
}

db.setDefaults({
  create: process.env.NODE_ENV !== 'production',
  prefix: process.env.DYNAMODB_PREFIX,
})


export const dynamoose = db

