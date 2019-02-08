import './setup'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { times } from 'underscore'
import { Post, PostPayload } from '../models/Post'
import { UserStatus } from '../models/User'
import {
  // @ts-ignore
  print,
  createApp,
  makeToken,
  randStr,
  truncate,
  gqlRequest,
  throwIfError,
  initUserResource,
  createUsers,
} from './helper'

//// Delaration ////

process.env.TOKEN_SECRET = 'testtokensecret'
const app = createApp()

const PostFields = [
  'id',
  'author',
  'contents',
  'loc',
  'createdAt',
  'updatedAt',
]

//// Graphql queries ////

const queryFields = `
  id
  author {
    id
    name
  }
  contents
  loc
  locOpen
  createdAt
  updatedAt
`

const getPost = (me: { id }, id) => {
  const query = `{
    post(id: "${id}") {
      ${queryFields}
    }
  }`

  const token = makeToken(me)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const authorPosts = (me: { id }, authorId, limit) => {
  const query = `{
    author(id: "${authorId}"){
      posts(
        limit: ${limit}
      ) {
        items {
          ${queryFields}
        }
      }
    }
  }`

  const token = makeToken(me)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

describe('User', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  // @ts-ignore
  const should = chai.should()

  const author = {
    id: randStr(),
    name: randStr(),
    email: `${randStr()}@example.com`,
    status: UserStatus.Confirmed,
  }

  before(async () => {
    await initUserResource()
    await createUsers([author])
  })

  describe('when get all', () => {
    const limit = 2

    before(async () => {
      await Promise.all([
        truncate(Post.Model, ['id']),
      ])
      await seeding(author, true, 10)
    })

    it('should pass', async () => {
      const posts = await authorPosts(null, author.id, limit)
        .then(r => r.body.data.author.posts.items)
      posts.should.be.length(limit)
    })
  })

  describe('when get single', () => {
    let created: PostPayload

    before(async () => {
      await truncate(Post.Model, ['id']),
      created = <any>await seeding(author, true)
    })

    it('should pass', async () => {
      const post = await getPost(null, created.id)
        .then(r => r.body.data.post)

      PostFields.forEach(f =>
        post.should.have.property(f).to.be.exist)

      post.should.have.property('id', created.id)
      post.should.have.property('contents', created.contents)
    })
  })

})

//// Helpers ////

function seeding(
    me: { id }, open, n=1): Promise<PostPayload | PostPayload[]> {
  const createPost = loc => ({
    id: randStr(),
    authorId: me.id,
    contents: randStr(),
    loc,
    locOpen: open === true ? loc: null,
  })

  const seeds = times(n, createPost)
  return Post.Model.batchPut(seeds)
    .then(() => n === 1 ? seeds[0] : seeds)
}
