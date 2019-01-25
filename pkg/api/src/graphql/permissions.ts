import { Forbidden } from 'http-errors'

export function shouldBeOwner(me, owner){
  if(me != owner)
    throw new Forbidden()
}
