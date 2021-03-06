import * as fs from 'fs'


export const curly = <T>(fn: (T) => any): (T) => T => {
  return (obj: T) => {
    fn(obj)
    return obj
  }
}

export function promisify(fn) {
  return function(...args){
    return new Promise((res, rej) => {
      const done = (er, r) => er ? rej(er) : res(r)
      fn.apply(this, [...args, done])
    })
  }
}

export function PromiseAll(
  promises: Array<Promise<any>>
): Promise<any[]>{
  return Promise.all(
    promises.map(p => p.catch(e => e))
  ).then(arr => {
    arr.forEach(e => {
      if(e instanceof Error) throw e
    })
    return arr
  })
}

export const readFile = promisify(fs.readFile)

export const readFileAll = fnames =>
  Promise.all(fnames.map(readFile))

const exec = (fn, ...args) =>
  fn instanceof Function ? fn(...args) : fn

const execPred = (fn, val) =>
  fn instanceof Function ? fn(val) : fn === val

const resolve = x => ({
  case: () => resolve(x),
  else: () => x,
})

export const when = (x?) => ({
  case: (pred, fn) => execPred(pred, x) ? resolve(exec(fn, x)) : when(x),
  else: fn => exec(fn, x),
})

export const pickBy = (o, pred) => {
  const r = {}
  Object.entries(o).forEach(([k, v]) => {
    if(pred(v, k)){
      r[k] = v
    }
  })
  return r
}

export const omitBy = (o, pred) => {
  const r = {}
  Object.entries(o).forEach(([k, v]) => {
    if(!pred(v, k)){
      r[k] = v
    }
  })
  return r
}

export const times = (n: number) => (Array(n).fill(0).map((_, i) => i))

export const isObject = o => o !== null && typeof o === 'object'

export const isEmpty = s =>
  isObject(s) ? !Object.keys(s).length : !s

export const fillEmpties = (keys, results) =>
  keys.map(K => _find(results, K))

function _find(items, K){
  // Use for loop instead of functions for perf
  // items.find(item => !entries.find(([k, v]) => item[k] !== v))
  for(const item of items){
    for(const k in K){
      if(item[k] !== K[k]) continue
    }
    return item
  }
  return null
}
