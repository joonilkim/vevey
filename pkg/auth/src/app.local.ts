import * as Promise from 'bluebird'
global.Promise = Promise

import { app } from './app'

const port = process.env.PORT || 8080

app.listen(port)
console.log(`listening on http://localhost:${port}`)
