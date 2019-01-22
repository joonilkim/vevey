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
