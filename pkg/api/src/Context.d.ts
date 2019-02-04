import { Note } from './models/Note'

interface User {
  id: string
}

interface Context {
  me: User
  Note: typeof Note
}
