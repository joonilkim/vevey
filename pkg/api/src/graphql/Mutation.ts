import { Forbidden, wrapError } from '@vevey/common'
import { Context } from '../Context'

export const schema = `
  type Mutation {

    createPost(
      contents: String!
    ): Post! @auth

    updatePost(
      id: ID!
      contents: String
      pos: Integer
    ): Post! @auth

    deletePost(
      id: ID!
    ): MutationResponse! @auth
  }

  type MutationResponse {
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
  _, { contents }, { me, Post }: Context,
) {
  const p = {
    contents,
  }
  return Post.create(me, p)
}

function updatePost(
  _, { id, contents, pos }, { me, Post }: Context,
) {
  const _wrapError = er => {
    if (er.code === 'ConditionalCheckFailedException')
      throw wrapError(er, Forbidden)
    throw er
  }

  return Post.update(me, id, { contents, pos })
    .catch(_wrapError)
}

function deletePost(
  _, { id }, { me, Post }: Context,
) {
  const _wrapError = er => {
    if (er.code === 'ConditionalCheckFailedException')
      throw wrapError(er, Forbidden)
    throw er
  }

  return Post.delete(me, id)
    .then(returnSuccess)
    .catch(_wrapError)
}

const returnSuccess = () => ({ result: true })
