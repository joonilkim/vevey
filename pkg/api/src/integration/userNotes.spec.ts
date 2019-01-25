import { expect } from 'chai'
import app from '../app'
import {
  request,
  randStr,
} from '../helper.spec'


describe('userNotes', () => {

  it('should success', async () => {
    const userId = randStr()
    const limit = 2

    const query = `{
      userNotes(userId: "${userId}", limit: ${limit}) {
        id,
        userId,
        pos
      }
    }`

    const res = await request(app)
      .set({ Authorization: userId })
      .send({ query })
    const data = res.body.data

    expect(data).to.have.property('userNotes')
  })

})
