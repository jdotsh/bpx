import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
// import { type AppRouter } from './routers'
type AppRouter = any // Placeholder for MVP
import superjson from 'superjson'

export const trpc = createTRPCReact<AppRouter>()

export function getTRPCClient() {
  return (trpc as any).createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
        headers() {
          return {
            // Add any headers here
          }
        },
      }),
    ],
  })
}