export const schema = `
  type Post {
    id: ID!
    authorId: ID!
    contents: String!
    pos: Integer!
    createdAt: Date!
    updatedAt: Date!
  }
`

export const resolvers = {
}
