import { GraphQLScalarType, Kind } from 'graphql'

const _Date = new GraphQLScalarType({
  name: 'Date',
  description: 'Date',
  serialize: t => new Date(t).toISOString(),
  parseValue: s => new Date(s).getTime(),
  parseLiteral: ast => {
    if(ast.kind === Kind.INT || ast.kind === Kind.STRING)
      return new Date(ast.value).getTime()
    throw TypeError(`Invalid timestamp: ${ast.loc}`)
  }
})


const _Integer = new GraphQLScalarType({
  name: 'Integer',
  description: 'Integer',
  serialize: _ => _,
  parseValue: s => parseInt(s, 10),
  parseLiteral: ast => {
    if(ast.kind === Kind.INT)
      return parseInt(ast.value, 10)
    throw TypeError(`Invalid integer type: ${ast.loc}`)
  }
})

export const schema = `
  scalar Date
  scalar Integer
`

export const resolvers = {
  Date: _Date,
  Integer: _Integer,
}
