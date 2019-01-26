export const schema = `
scalar BigInt
scalar DateTime

type Query {
  ping: String!
  userNotes(
    userId: ID!
    pos: BigInt = ${Number.MAX_SAFE_INTEGER}
    limit: Int!
  ): [Note!]!
}

type Mutation {
  createNote(
    contents: String!
  ): Note
}

type Note {
  id: ID!,
  userId: ID!,
  contents: String!
  pos: BigInt!
  createdAt: DateTime!
  updatedAt: DateTime!
}
`
