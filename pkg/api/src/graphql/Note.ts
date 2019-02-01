export const schema = `
  type Note {
    id: ID!
    userId: ID!
    contents: String!
    pos: Integer!
    createdAt: Date!
    updatedAt: Date!
  }
`

export const resolvers = {
}
