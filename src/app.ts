import { fastify } from 'fastify'
import cookie from '@fastify/cookie'
import { authRoute } from './modules/auth/auth.route.js'
import { mealsRoute } from './modules/meals/meals.route.js'
import { authPlugin } from './plugins/auth.js'

export const app = fastify()

app.register(cookie)
app.register(authPlugin)

app.register(authRoute, { prefix: '/auth' })
app.register(mealsRoute, { prefix: '/meals' })

export default app