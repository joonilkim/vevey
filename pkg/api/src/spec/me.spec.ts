import './setup'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { times } from 'underscore'
import { Model, PostPayload } from '../models/Post'
import { UserStatus } from '../models/User'
import {
  // @ts-ignore
  print,
  createApp,
  makeToken,
  randInt,
  randStr,
  truncate,
  gqlRequest,
  throwIfError,
  initUserResource,
  createUsers,
} from './helper'

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

describe('Me', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  // @ts-ignore
  const should = chai.should()

  const me = {
    id: randStr(),
    name: randStr(),
    email: `${randStr()}@example.com`,
    status: UserStatus.Confirmed,
  }

  before(async () => {
    await initUserResource()
    await createUsers([me])
  })

  describe('when create privately', () => {
    let created: PostPayload

    before(async () => {
      await Promise.all([
        truncate(Model, ['id']),
      ])
    })

    it('should pass', async () => {
      const contents = randStr()
      created = await createPost(me, { contents, open: false })
        .then(r => r.body.data.createPost)

      PostFields.forEach(f =>
        created.should.have.property(f).to.be.exist)

      const d = <PostPayload>await Model.get({ id: created.id })
      d.should.have.property('contents', contents)
      d.should.not.have.property('locOpen')
    })

    it('should require token', async () => {
      const contents = randStr()
      await createPost(null, { contents, open: false })
        .should.be.rejectedWith('Unauthorized')
    })

    it('should update', async () => {
      const p = {
        id: created.id,
        contents: randStr(),
        loc: randInt(),
        open: false,
      }
      const updated = await updatePost(me, p)
        .then(r => r.body.data.updatePost)

      PostFields.forEach(f =>
        updated.should.have.property(f).to.be.exist)

      const data = <PostPayload>await Model.get({ id: created.id })
      data.should.have.property('contents', p.contents)
      data.should.have.property('loc', p.loc)

      new Date(updated.updatedAt)
        .should.be.above(new Date(created.updatedAt))
    })

    it('should not update without token', async () => {
      const p = {
        id: created.id,
        contents: randStr(),
        loc: randInt(),
        open: false,
      }
      await updatePost(null, p)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should not be changed by others', async () => {
      const p = {
        id: created.id,
        contents: randStr(),
        loc: randInt(),
        open: false,
      }
      const notMe = { id: randStr() }

      await updatePost(notMe, p)
        .should.be.rejectedWith('NoPermission')
    })
  })

  describe('when delete', () => {
    let created: PostPayload

    before(async () => {
      await Promise.all([
        truncate(Model, ['id']),
      ])
      created = <PostPayload>await seeding(me, false)
    })

    it('should pass', async () => {
      const r = await deletePost(me, created.id)
      r.body.data.deletePost
        .should.have.property('result', true)

      const post = await Model.get({ id: created.id })
      post.should.have.property('id', created.id)
      post.should.not.have.property('contents')
    })

    it('should not pass without token', async () => {
      await deletePost(null, created.id)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should not be queried', async () => {
      await myPosts(me, 10)
        .then(r => r.body.data.me.posts.items)
        .should.eventually.be.length(0)

      await getPost(me, created.id)
        .then(r => r.body.data.post)
        .should.eventually.not.exist
    })
  })

  describe('when get all', () => {
    const limit = 2

    before(async () => {
      await Promise.all([
        truncate(Model, ['id']),
      ])
      await seeding(me, false, 10)
    })

    it('should pass', async () => {
      const posts = await myPosts(me, limit)
        .then(r => r.body.data.me.posts.items)
      posts.should.be.length(limit)
    })

    it('should not pass without token', async () => {
      await myPosts(null, limit)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should not pass with invalid params', async () => {
      await myPosts(me, -1)
        .should.be.rejectedWith('OutOfRangeInput')

      await myPosts(me, 10000)
        .should.be.rejectedWith('OutOfRangeInput')
    })
  })

  describe('when get single', () => {
    let created: PostPayload

    before(async () => {
      await Promise.all([
        truncate(Model, ['id']),
      ])
      created = <PostPayload>await seeding(me, false)
    })

    it('should pass', async () => {
      const post = await getPost(me, created.id)
        .then(r => r.body.data.post)

      PostFields.forEach(f =>
        post.should.have.property(f).to.be.exist)

      post.should.have.property('id', created.id)
      post.should.have.property('contents', created.contents)
    })

    it('should not pass without token', async () => {
      await getPost(null, created.id)
        .should.be.rejectedWith('NoPermission')
    })
  })

})

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

const createPost = (me: { id }, { contents, open }) => {
  const query = `mutation {
    createPost(
      contents: "${contents}"
      open: ${open}
    ) {
      ${queryFields}
    }
  }`

  const token = makeToken(me)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const updatePost = (me: { id }, { id, contents, loc, open }) => {
  const query = `mutation {
    updatePost(
      id: "${id}"
      contents: "${contents}"
      loc: ${loc}
      open: ${open}
    ) {
      ${queryFields}
    }
  }`

  const token = makeToken(me)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const deletePost = (me: { id }, id) => {
  const query= `mutation {
    deletePost(id: "${id}"){
      result
    }
  }`

  const token = makeToken(me)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const getPost = (me: { id }, id) => {
  const query = `{
    post(id: "${id}") {
      ${queryFields}
    }
  }`

  const token =  makeToken(me)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const myPosts = (me: { id }, limit) => {
  const query = `{
    me {
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


//// Helpers ////

function seeding(
    me: { id }, open, n=1): Promise<PostPayload | PostPayload[]> {
  const createPost = loc => ({
    id: randStr(),
    authorId: me.id,
    contents: randStr(),
    loc,
    open,
  })

  const seeds = times(n, createPost)
  return Model.batchPut(seeds)
    .then(() => n === 1 ? seeds[0] : seeds)
}
