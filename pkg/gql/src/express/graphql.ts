import * as express from 'express'
import * as graphql from 'express-graphql'
import { formatError } from './formatError'

export interface Context { [_: string]: any }

interface Options extends graphql.OptionsData {
  createContext: (req: express.Request) => Context
  wrapError?: (er: Error) => Error
}

export const graphqlHttp = (options: Options) => {
  const wrapError = options.wrapError || (_ => _)

  return (req, res, next) => {
    return graphql({
      context: options.createContext(req),
      formatError(err){
        let er = err['originalError'] || err
        er = er['errors'] ? er['errors'][0] : er
        er = wrapError(er)

        // When error is occured, graphql composes its response,
        // instead of forwarding to last.  So, log them here.
        const level = er['isUserError'] ? 'info' : 'error'
        req.log[level]({ err })

        return formatError(er)
      },
      ...options,
    })(req, res)
    .catch(next)
  }
}
