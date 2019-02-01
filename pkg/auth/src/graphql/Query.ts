export const schema = `
  type Query {
    ping: String!
  }
`

export const resolvers = {
  Query: {
    ping: () => 'ok',
  }
}
