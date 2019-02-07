import * as assert from 'assert-err'
import { generate as generateUUID } from 'short-uuid'
import { UpdateOption } from 'dynamoose'
import { pickBy, isEmpty, Forbidden } from '@vevey/common'
import { dynamoose } from '../connectors/dynamoose'

export interface PostResponse {
  id?: string
  authorId?: number
  contents?: string
  pos?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface PostPage {
  items: PostResponse[]
}

export const PostSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
  },
  authorId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'pos',
      name: 'byAuthor',
      project: true,
      throughput: 1,
    }
  },
  contents: {
    type: String,
    default: '',
    trim: true,
  },
  pos: {
    type: Number,
    default: Number.MAX_SAFE_INTEGER,
    validate: _ => _ >= 0
  },
}, {
  throughput: {read: 1, write: 1},
  timestamps: true,
  saveUnknown: false,
})

export const Model = dynamoose.model('Post', PostSchema)

export class Post {
  static Model = Model

  model

  constructor(params){
    this.model = new Model(params)
  }

  static create(
    me: { id }, params: { contents }
  ): Promise<PostResponse> {
    const m = new Model({
      id: generateUUID(),
      pos: Date.now(),
      authorId: me.id,
      ...params,
    })

    return m.save()
      .then(() => <PostResponse>m)
  }

  static update(
    me: { id }, id: string, { contents, pos }
  ): Promise<PostResponse> {
    const key = { id }
    const p = pickBy({ contents, pos }, v => !isEmpty(v))
    const ops = {
      condition: 'authorId = :authorId',
      conditionValues: { authorId: me.id },
      returnValues: 'ALL_NEW',
    }
    return <Promise<any>>Model.update(key, p, <UpdateOption><any>ops)
  }

  static delete(me: { id }, id: string): Promise<void> {
    const key = { id }
    const p = { contents: null, pos: null }
    const ops = {
      condition: 'authorId = :authorId',
      conditionValues: { authorId: me.id},
    }
    return Model.update(key, { $DELETE: p }, <UpdateOption><any>ops)
      .then(returnNothing)
  }

  static allByAuthor(
    me: { id }, authorId: string, { pos, limit }
  ): Promise<PostPage> {
    assert(me.id === authorId, Forbidden)

    return Model
      .query('authorId').eq(authorId)
      .where('pos').lt(pos)
      .filter('contents').not().null()
      .limit(limit)
      .descending()
      .exec()
      .then(pagination)
  }

  static get(me: { id }, id: string): Promise<PostResponse> {
    const filterDeleted = post =>
      post && post.contents ? post : null

    const shouldHavePerm = post => {
      if(post) assert(me.id === post.authorId, Forbidden)
      return post
    }

    return Model
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

// @ts-ignore
const parseDynamo = async (Item) => {
  const m = new Model()
  await PostSchema.parseDynamo(m, Item)
  return <PostResponse>m
}
