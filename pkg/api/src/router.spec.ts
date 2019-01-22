import { expect } from 'chai'
import * as express from 'express'
import * as pino from 'pino'
import * as request from 'supertest'
import router from './router'

const env = process.env.NODE_ENV || 'test'

describe('router', () => {

  describe('notes', () => {

    it('should return results', async () => {
      const _router = router({ env })

      const query = `{
        notes {
          id,
          user_id,
          pos
        }
      }`

      const res = await request(_router)
        .post('/gql')
        .send({ query })

      expect(res.body.data).to.have.property('notes')
      expect(res.body.data.notes).to.have.length.above(0)
    })

  })
})
