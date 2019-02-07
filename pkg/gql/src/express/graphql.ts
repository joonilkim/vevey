import * as express from 'express'
import * as graphql from 'express-graphql'
import * as uuidv4 from 'uuid/v4'
import {
  wrapError,
  InvalidGraphqlSyntax,
  InternalError,
} from '@vevey/common'


export interface Context { [_: string]: any }

interface Options extends graphql.OptionsData {
  createContext: (req: express.Request) => Context
  wrapError?: (er: Error) => Error
}

export const graphqlHttp = (options: Options) => {
  return (req, res, next) => {
    return graphql({
      context: options.createContext(req),
      formatError(err){
        const er = decorateError(err)
        er['id'] = uuidv4()

        const level = er.statusCode >= 500 ? 'error' : 'info'
        req.log[level]({ err: er })

        return {
          id: er['id'],
          code: er.code,
          statusCode: er.statusCode,
          message: er.message,
          extra: er.extra,
        }
      },
      ...options,
    })(req, res)
    .catch(next)
  }
}

export const decorateError = er => {
  if(er.code && er.statusCode) { return er }
  if(!er['originalError']) {
    return wrapError(er, InvalidGraphqlSyntax)
  }

  er = er.originalError
  if(er.code && er.statusCode) { return er }
  return wrapError(er, InternalError)
}
