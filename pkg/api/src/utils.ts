import * as short from 'short-uuid'
import * as fs from 'fs'

export const createUUID = short.generate

export function PromiseAll<T>(promises: Promise<T>[]): Promise<T[]>{
  return Promise.all<T>(
    promises.map(p => p.catch(e => e))
  ).then(arr => {
    arr.forEach(e => {
      if(e instanceof Error) throw e
    })
    return arr
  })
}

export const promisify = fn => (...args) =>
  new Promise((rs, rj) =>
    fn(...args, (er, data) => {
      if(er) return rj(er)
      return rs(data)
    }))

export const readFile = promisify(fs.readFile)

export const readFileAll = fnames =>
  PromiseAll(fnames.map(readFile))
