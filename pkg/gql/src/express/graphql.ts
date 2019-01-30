import * as express from 'express'
import * as graphql from 'express-graphql'
import { formatError } from './formatError'

export interface Context { [_: string]: any }

export interface Options extends graphql.OptionsData {
  createContext: (req: express.Request) => Context
}

export const graphqlHttp = (options: Options) => {

  return (req, res, next) => {
    return graphql({
      context: options.createContext(req),
      formatError(err){
        // When error is occured, graphql composes its response, instead of
        // forwarding errors to last.
        // So, log errors in here.
        const er = err['originalError'] || err
        const isUserError = !err['originalError'] || er['isUserError']
        const level = isUserError ? 'info' : 'error'
        req.log[level]({ err })
        return formatError(err)
      },
      ...options,
    })(req, res)
    .catch(next)
  }
}
