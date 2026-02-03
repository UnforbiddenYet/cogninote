import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../styles/tailwind.css'

function RootComponent() {
  return (
    <div>
      <Outlet />
    </div>
  )
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary">404</h1>
        <p className="mt-2 text-lg text-muted">Page not found</p>
        <a href="/" className="mt-4 inline-block text-primary hover:underline">
          Go home
        </a>
      </div>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})
