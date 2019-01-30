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

export const schema = `
  scalar Date
`

export const resolvers = {
  Date: _Date,
}
