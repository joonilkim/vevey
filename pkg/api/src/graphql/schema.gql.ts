import { DYNAMODB_MAX_INT } from '../constants'

export const schema = `
type Query {
  ping: String!
  userNotes(
    userId: ID!
    limit: Int!
    pos: Int = ${DYNAMODB_MAX_INT}
  ): [Note!]!
}

type Note {
  id: ID!,
  userId: ID!,
  pos: Int!
}
`
