import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      throw redirect({ to: '/app' })
    } else {
      throw redirect({ to: '/auth/login' })
    }
  },
})
