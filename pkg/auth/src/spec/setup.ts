import * as Promise from 'bluebird'
global.Promise = Promise

process.env.DYNAMODB_ENDPOINT= 'http://dynamodb:8000'
process.env.DYNAMODB_PREFIX = '__'
