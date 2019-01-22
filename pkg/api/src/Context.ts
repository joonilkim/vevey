import * as express from 'express'
import * as graphql from 'graphql'
import { Notes } from './models/Notes'

export class Context {
  env: string
  user: {}
  Notes: Notes

  constructor(req: { env, user } , connector: {}){
    this.env = req.env
    this.user = req.user
    this.Notes = new Notes(connector)
  }
}
