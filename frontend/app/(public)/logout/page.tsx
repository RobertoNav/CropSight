// app/logout/page.tsx
// Server component that clears the session and redirects to /login.

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function LogoutPage() {
  const cookieStore = cookies()
  // Clear the auth token cookie
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
  redirect('/login')
}
