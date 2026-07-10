import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

// Initialize table helper for newsletter list
let isDbInitialized = false
async function initDb() {
  if (isDbInitialized) return
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS newsletter (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  isDbInitialized = true
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Initialize DB table if not already created
    await initDb()

    // Duplicate check in Turso newsletter table
    const checkResult = await turso.execute({
      sql: 'SELECT 1 FROM newsletter WHERE email = ? LIMIT 1',
      args: [trimmedEmail]
    })

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'This email is already subscribed!' },
        { status: 409 }
      )
    }

    // Save email to database
    await turso.execute({
      sql: 'INSERT INTO newsletter (email) VALUES (?)',
      args: [trimmedEmail]
    })

    return NextResponse.json(
      { message: "You're successfully subscribed to the newsletter!" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error handling newsletter subscription:', error)
    
    if (error.code === 'SQLITE_CONSTRAINT' || (error.message && error.message.includes('UNIQUE constraint'))) {
      return NextResponse.json(
        { error: 'This email is already subscribed!' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected database error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
