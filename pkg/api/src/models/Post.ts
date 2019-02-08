import * as assert from 'assert-err'
import { generate as uuid } from 'short-uuid'
import { pick, identity, uniq, values, isNumber, isBoolean } from 'underscore'
import * as DataLoader from 'dataloader'
import { UpdateOption } from 'dynamoose'
import { wrapError, fillEmpties, NoPermission } from '@vevey/common'
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

export const Model = dynamoose.model('Post', PostSchema)

const batchGet = (keys: object[]) =>
  Model
    .batchGet(uniq(keys, (v) => values(v).join(',')))
    .then(r => fillEmpties(keys, r))

export const init = () => {
  return createModel
}

export type PostModel = ReturnType<typeof createModel>

export function createModel(){
  const dataloader = new DataLoader(batchGet)

  return {
    create(me: { id }, { contents, open }): Promise<PostPayload> {
      const loc = Date.now()
      const m = new Model({
        id: uuid(),
        authorId: me.id,
        loc,
        locOpen: open === true ? loc: null,
        contents,
      })

      return m.save()
        .then(() => <PostPayload>m)
    },

    update(me: { id }, id: string, { contents, loc, open }): Promise<PostPayload> {
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
        return <Promise<any>>Model
          .update(key, p, <UpdateOption><any>ops)
      }

      return <Promise<any>>Model
        .update(key, p, <UpdateOption><any>ops)
        .then(updateOpen)
        .catch(handleConditionFailed)
    },

    delete(me: { id }, id: string): Promise<void> {
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
      return Model
        .update(key, { $DELETE: p }, <UpdateOption><any>ops)
        .then(returnNothing)
        .catch(handleConditionFailed)
    },

    all(me: { id }, authorId, { loc, limit }): Promise<PostPage> {
      let query = Model
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
    },

    get(me: { id }, id: string): Promise<PostPayload> {
      const filterDeleted = (post?) =>
        post && post.contents ? post : null

      const shouldHavePerm = (post?) => {
        if(!post) { return post }
        assert(
          isOpen(post) || me.id === post.authorId,
          NoPermission)
        return post
      }

      return dataloader.load({ id })
        .then(filterDeleted)
        .then(shouldHavePerm)
    }
  }
}

const returnNothing = () => null

const pagination = items => ({ items })

const isOpen = ({locOpen}) => isNumber(locOpen)
