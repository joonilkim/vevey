export const schema = `
  type Post {
    id: ID!
    author: Author!
    contents: String!
    loc: Integer!
    locOpen: Integer
    createdAt: Date!
    updatedAt: Date!
  }

  type PostList {
    items: [Post!]!
  }
`

export const resolvers = {
  Post: {
    author
  }
}

function author({ authorId }, args, { me, User }){
  return User.get(me, authorId)
}
