import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../styles/tailwind.css'

function RootComponent() {
  return (
    <div>
      <Outlet />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
