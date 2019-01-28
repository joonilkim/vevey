export const schema = `
  type Note {
    id: ID! @auth
    userId: ID! @auth(me: true)
    contents: String! @auth
    pos: Integer!
    createdAt: Date!
    updatedAt: Date!
  }
`

export const resolvers = {
}
