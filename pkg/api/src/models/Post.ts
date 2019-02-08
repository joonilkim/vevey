import * as assert from 'assert-err'
import { generate as uuid } from 'short-uuid'
import { UpdateOption } from 'dynamoose'
import { pick, identity, isNumber, isBoolean } from 'underscore'
import { wrapError, NoPermission } from '@vevey/common'
import { dynamoose } from '../connectors/dynamoose'

export interface PostPayload {
  id?: string
  authorId?: number
  contents?: string
  loc?: number
  locOpen?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface PostPage {
  items: PostPayload[]
}

export const PostSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
  },
  authorId: {
    type: String,
    required: true,
    index: [
      {
        global: true,
        rangeKey: 'loc',
        name: 'byAuthor',
        project: true,
        throughput: 1,
      },
      {
        global: true,
        rangeKey: 'locOpen',
        name: 'openOnly',
        project: true,
        throughput: 1,
      },
    ]
  },
  contents: {
    type: String,
    default: '',
    trim: true,
  },
  loc: {
    type: Number,
    default: Number.MAX_SAFE_INTEGER,
    validate: _ => _ >= 0
  },
  locOpen: {
    type: Number,
  },
}, {
  throughput: {read: 1, write: 1},
  timestamps: true,
  saveUnknown: false,
})

export class Post {
  static Model = dynamoose.model('Post', PostSchema)

  model

  constructor(params){
    this.model = new Post.Model(params)
  }

  static create(
    me: { id }, { contents, open }
  ): Promise<PostPayload> {
    const loc = Date.now()
    const m = new Post.Model({
      id: uuid(),
      authorId: me.id,
      loc,
      locOpen: open === true ? loc: null,
      contents,
    })

    return m.save()
      .then(() => <PostPayload>m)
  }

  static update(
    me: { id }, id: string, { contents, loc, open }
  ): Promise<PostPayload> {
    const handleConditionFailed = er => {
      if (er.code === 'ConditionalCheckFailedException')
        throw wrapError(er, NoPermission)
      throw er
    }

    const key = { id }
    const p = pick({ contents, loc }, identity)
    const ops = {
      condition: 'authorId = :authorId',
      conditionValues: { authorId: me.id },
      returnValues: 'ALL_NEW',
    }

    const updateOpen = (post?) => {
      const needsUpdate = post && isBoolean(open) &&
        (open && !isOpen(post)) ||
        (!open && isOpen(post))

      if(!needsUpdate) { return post }

      const p = !open ?
        { $DELETE: { locOpen: null }} :
        { locOpen: post.loc }
      return <Promise<any>>Post.Model
        .update(key, p, <UpdateOption><any>ops)
    }

    return <Promise<any>>Post.Model
      .update(key, p, <UpdateOption><any>ops)
      .then(updateOpen)
      .catch(handleConditionFailed)
  }

  static delete(me: { id }, id: string): Promise<void> {
    const handleConditionFailed = er => {
      if (er.code === 'ConditionalCheckFailedException')
        throw wrapError(er, NoPermission)
      throw er
    }

    const key = { id }
    const p = { contents: null, loc: null }
    const ops = {
      condition: 'authorId = :authorId',
      conditionValues: { authorId: me.id },
    }
    return Post.Model
      .update(key, { $DELETE: p }, <UpdateOption><any>ops)
      .then(returnNothing)
      .catch(handleConditionFailed)
  }

  static all(
    me: { id }, authorId, { loc, limit }
  ): Promise<PostPage> {
    let query = Post.Model
      .query('authorId')
      .eq(authorId)

    if(me.id === authorId) {
      query = query.where('loc').lt(loc)
    } else {
      query = query.where('locOpen').lt(loc)
    }

    return query
      .filter('contents').not().null()
      .limit(limit)
      .descending()
      .exec()
      .then(pagination)
  }

  static get(me: { id }, id: string): Promise<PostPayload> {
    const filterDeleted = (post?) =>
      post && post.contents ? post : null

    const shouldHavePerm = (post?) => {
      if(!post) { return post }
      assert(
        isOpen(post) || me.id === post.authorId,
        NoPermission)
      return post
    }

    return Post.Model
      .get({ id })
      .then(filterDeleted)
      .then(shouldHavePerm)
  }

}

export const createModel = (options={}) => {
  Object.entries(options).forEach(([k, v]) => Post[k] = v)
  return Post
}

const returnNothing = () => null

const pagination = items => ({ items })

const isOpen = ({locOpen}) => isNumber(locOpen)
