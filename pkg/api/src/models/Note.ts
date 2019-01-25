import dynamoose from '../connectors/dynamoose'
import { DYNAMODB_MAX_INT } from '../constants'

export const NoteSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
  },
  userId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'pos',
      name: 'byUser',
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
    default: DYNAMODB_MAX_INT,
    validate: _ => _ >= 0
  }
}, {
  //throughput: 'ON_DEMAND',
  throughput: {read: 1, write: 1},
  timestamps: true,
  saveUnknown: false,
})

export const Note = dynamoose.model('Notes', NoteSchema)
