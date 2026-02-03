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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600">404</h1>
        <p className="mt-2 text-lg text-gray-500">Page not found</p>
        <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
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
