import { GraphQLScalarType, Kind } from 'graphql'

export const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO Date',
  serialize: t => new Date(t).toISOString(),
  parseValue: s => new Date(s).getTime(),
  parseLiteral: ast => {
    if(ast.kind === Kind.INT || ast.kind === Kind.STRING)
      return new Date(ast.value).getTime()
    throw TypeError(`Invalid timestamp: ${ast.loc}`)
  }
})


export const BigInt = new GraphQLScalarType({
  name: 'BigInt',
  description: 'BigInt',
  serialize: _ => _,
  parseValue: s => parseInt(s, 10),
  parseLiteral: ast => {
    if(ast.kind === Kind.INT)
      return parseInt(ast.value, 10)
    throw TypeError(`Invalid integer type: ${ast.loc}`)
  }
})
