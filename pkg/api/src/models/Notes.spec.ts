import { expect } from 'chai'
import * as AWS from 'aws-sdk'
import { Notes } from './Notes'

function mockConnector(): AWS.DynamoDB {
  return <AWS.DynamoDB>{
  }
}

describe('Notes', () => {

  describe('list', () => {

    it('should return notes', async function(){
      const model = new Notes(mockConnector())

      const notes = await model.list()
      expect(notes).to.have.length.above(0)
    })

  })

})
