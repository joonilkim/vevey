import { GraphQLScalarType, Kind } from 'graphql'

const Integer = new GraphQLScalarType({
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
  scalar Integer
`

export const resolvers = {
  Integer: Integer,
}
