import * as jwt from 'jsonwebtoken'

export const auth = ({ secret }) => {
  return (req, res, next) => {
    const token = req.get('Authorization')

    jwt.verify(token, secret, (er, payload) => {
      // skip error

      req['user'] = payload || { id: null }
      next()
    })
  }

}
