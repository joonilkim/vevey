import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as jwt from 'jsonwebtoken'
import { times } from '@vevey/common'
import { Post, PostResponse } from '../models/Post'
import {
  // @ts-ignore
  print,
  createApp,
  randInt,
  randStr,
  truncate,
  gqlRequest,
  throwIfError,
} from './helper.spec'

//// Delaration ////

process.env.TOKEN_SECRET = 'testtokensecret'
const app = createApp()

const PostFields = [
  'id', 'authorId',
  'contents', 'pos',
  'createdAt', 'updatedAt',
]

//// Graphql queries ////

const createPost = (userId, { contents }) => {
  const query = `mutation {
    createPost(
      contents: "${contents}"
    ) {
      ${PostFields.join('\n')}
    }
  }`

  const token = makeToken(userId)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const updatePost = (userId, { id, contents, pos }) => {
  const query = `mutation {
    updatePost(
      id: "${id}"
      contents: "${contents}"
      pos: ${pos}
    ) {
      ${PostFields.join('\n')}
    }
  }`

  const token = makeToken(userId)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const deletePost = (userId, id) => {
  const query= `mutation {
    deletePost(id: "${id}"){
      result
    }
  }`

  const token = makeToken(userId)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const getPost = (userId, id) => {
  const query = `{
    getPost(id: "${id}") {
      ${PostFields.join('\n')}
    }
  }`

  const token = makeToken(userId)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const postsByAuthor = (userId, authorId, limit) => {
  const query = `{
    postsByAuthor(
      authorId: "${authorId}"
      limit: ${limit}
    ) {
      items {
        ${PostFields.join('\n')}
      }
    }
  }`

  const token = makeToken(userId)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

describe('Post', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  // @ts-ignore
  const should = chai.should()

  describe('when create', () => {
    const userId = randStr()
    let created: PostResponse

    before(async () => {
      await Promise.all([
        truncate(Post.Model, ['id']),
      ])
    })

    it('should pass', async () => {
      const contents = randStr()
      const { id } = await createPost(userId, { contents })
        .then(r => r.body.data.createPost)

      created = <PostResponse>await Post.Model.get({ id })

      PostFields.forEach(f =>
        created.should.have.property(f).to.be.exist)
    })

    it('should require token', async () => {
      const contents = randStr()
      await createPost(null, { contents })
        .should.be.rejectedWith('Unauthorized')
    })

    it('should update', async () => {
      const p = {
        id: created.id,
        contents: randStr(),
        pos: randInt(),
      }
      const updated = await updatePost(userId, p)
        .then(r => r.body.data.updatePost)

      PostFields.forEach(f =>
        updated.should.have.property(f).to.be.exist)

      updated.contents.should.be.equal(p.contents)
      updated.pos.should.be.equal(p.pos)
      new Date(updated.updatedAt)
        .should.be.above(new Date(created.updatedAt))
    })

    it('should not update without token', async () => {
      const p = {
        id: created.id,
        contents: randStr(),
        pos: randInt(),
      }
      await updatePost(null, p)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should not be changed by others', async () => {
      const p = {
        id: created.id,
        contents: randStr(),
        pos: randInt(),
      }
      const notMe = randStr()

      await updatePost(notMe, p)
        .should.be.rejectedWith('Forbidden')
    })
  })

  describe('when delete', () => {
    const userId = randStr()
    let created: PostResponse

    before(async () => {
      await Promise.all([
        truncate(Post.Model, ['id']),
      ])
      created = <PostResponse>await seeding(userId)
    })

    it('should pass', async () => {
      const r = await deletePost(userId, created.id)
      r.body.data.deletePost
        .should.have.property('result', true)

      const post = await Post.Model.get({ id: created.id })
      post.should.have.property('id', created.id)
      post.should.not.have.property('contents')
    })

    it('should not pass without token', async () => {
      await deletePost(null, created.id)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should not be queried', async () => {
      await postsByAuthor(userId, userId, 10)
        .then(r => r.body.data.postsByAuthor.items)
        .should.eventually.be.length(0)

      await getPost(userId, created.id)
        .then(r => r.body.data.getPost)
        .should.eventually.not.exist
    })
  })

  describe('when get all', () => {
    const userId = randStr()
    const limit = 2

    before(async () => {
      await Promise.all([
        truncate(Post.Model, ['id']),
      ])
      await seeding(userId, 10)
    })

    it('should pass', async () => {
      const posts = await postsByAuthor(userId, userId, limit)
        .then(r => r.body.data.postsByAuthor.items)
      posts.should.be.length(limit)
    })

    it('should not pass without token', async () => {
      await postsByAuthor(null, userId, limit)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should not pass with invalid params', async () => {
      await postsByAuthor(userId, userId, -1)
        .should.be.rejectedWith('ValidationError')

      await postsByAuthor(userId, userId, 10000)
        .should.be.rejectedWith('ValidationError')
    })
  })

  describe('when get single', () => {
    const userId = randStr()
    let created: PostResponse

    before(async () => {
      await Promise.all([
        truncate(Post.Model, ['id']),
      ])
      created = <PostResponse>await seeding(userId)
    })

    it('should pass', async () => {
      const post = await getPost(userId, created.id)
        .then(r => r.body.data.getPost)

      PostFields.forEach(f =>
        post.should.have.property(f).to.be.exist)

      post.should.have.property('id', created.id)
      post.should.have.property('contents', created.contents)
    })

    it('should not pass without token', async () => {
      await getPost(null, created.id)
        .should.be.rejectedWith('Unauthorized')
    })
  })

})

//// Helpers ////

function seeding(userId, n=1): Promise<PostResponse | PostResponse[]> {
  const createPost = pos => ({
    id: randStr(),
    authorId: userId,
    contents: randStr(),
    pos,
  })

  const seeds = times(n).map(createPost)
  return Post.Model.batchPut(seeds)
    .then(() => n === 1 ? seeds[0] : seeds)
}

function makeToken(userId: string){
  const secret = process.env.TOKEN_SECRET
  return { accessToken: jwt.sign({ id: userId }, secret) }
}
