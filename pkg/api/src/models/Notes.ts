export class Notes {
  constructor(protected connnector: {}){}

  async list(){
    return [{id: 1, user_id: 1}]
  }
}
