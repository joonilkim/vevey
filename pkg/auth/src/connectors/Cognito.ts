import * as AWS from 'aws-sdk'

export type Cognito = AWS.CognitoIdentityServiceProvider
export type UserType = AWS.CognitoIdentityServiceProvider.UserType

export function createCognito(){
  // Should specify AWS.config.region before this
  return new AWS.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-18',
    maxRetries: 3,
    httpOptions: {
      connectTimeout: 5000,
      timeout: 30000,
    },
  })
}
