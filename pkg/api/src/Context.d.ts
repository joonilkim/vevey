import { ModelConstructor } from 'dynamoose'

interface User {
  id: String
}

interface Context {
  me: User
  Note: ModelConstructor<{}, {}>
}
