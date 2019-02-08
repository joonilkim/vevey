import { isBoolean } from 'underscore'
import { Context } from '../Context'

export const schema = `
  type Mutation {

    createPost(
      contents: String! @constraint(maxLength: 3000)
      open: Boolean
    ): Post! @auth

    updatePost(
      id: ID!
      contents: String
      loc: Integer
      open: Boolean
    ): Post! @auth

    deletePost(
      id: ID!
    ): MutationResult! @auth

  }

  type MutationResult {
    result: Boolean!
  }
`

export const resolvers = {
  Mutation: {
    createPost,
    updatePost,
    deletePost,
  }
}

function createPost(
    _, { contents, open }, { me, Post }: Context) {
  open = isBoolean(open) ? open : false
  const p = { contents, open }
  return Post.create(me, p)
}

function updatePost(
    _, { id, contents, loc, open }, { me, Post }: Context) {
  return Post.update(me, id, { contents, loc, open })
}

function deletePost(_, { id }, { me, Post }: Context) {
  return Post.delete(me, id)
    .then(returnSuccess)
}

const returnSuccess = () => ({ result: true })
