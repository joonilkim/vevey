import * as assert from 'assert'

export const auth = () => {
  return (req, res, next) => {
    const id = req.get('Authorization')
    assert(!['null', 'undefined'].includes(id))

    req['user'] = { id }
    next()
  }

}
