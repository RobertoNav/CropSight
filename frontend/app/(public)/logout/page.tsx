// app/(public)/logout/page.tsx

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { env } from '@/lib/env'

export default async function LogoutPage() {
  const cookieStore =
    await cookies()

  const refreshToken =
    cookieStore.get(
      'refresh_token'
    )?.value

  try {
    if (refreshToken) {
      await fetch(
        `${env.apiUrl}/auth/logout`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            refresh_token:
              refreshToken,
          }),
        }
      )
    }
  } catch (error) {
    console.error(
      'Logout error:',
      error
    )
  }

  /* ───────────────── CLEAR COOKIES ───────────────── */

  cookieStore.delete(
    'access_token'
  )

  cookieStore.delete(
    'refresh_token'
  )

  cookieStore.delete('role')

  cookieStore.delete('user')

  /* ───────────────── REDIRECT ───────────────── */

  redirect('/login')
}