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
  return Post.update(me, id, { contents, pos })
}

function deletePost(
  _, { id }, { me, Post }: Context,
) {
  return Post.delete(me, id)
    .then(returnSuccess)
}

const returnSuccess = () => ({ result: true })
