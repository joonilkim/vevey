import { Post } from './models/Post'

interface User {
  id: string
}

interface Context {
  me: User
  Post: typeof Post
}
