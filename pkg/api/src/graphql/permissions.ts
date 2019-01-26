import { Forbidden } from 'http-errors'

export function shouldLogin({ id }){
  if(!!id)
    throw new Forbidden()
}

export function shouldBeOwner({ id }, owner){
  if(id != owner)
    throw new Forbidden()
}
