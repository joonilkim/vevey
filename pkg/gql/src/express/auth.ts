import * as jwt from 'jsonwebtoken'

export const auth = ({ secret }) => {
  return (req, res, next) => {
    const val = req.get('Authorization')
    const token = val && val.length > 7 ? val.substr(7) : ''

    jwt.verify(token, secret, (er, payload) => {
      // skip error

      req['user'] = payload || { id: null }
      next()
    })
  }

}
