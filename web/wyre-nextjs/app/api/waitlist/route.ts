import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

// Initialize table helper
let isDbInitialized = false
async function initDb() {
  if (isDbInitialized) return
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS waitlist (
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

    // 1. Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    // 2. Initialize DB table if not already created
    await initDb()

    // 3. Duplicate check in Turso waitlist table
    const checkResult = await turso.execute({
      sql: 'SELECT 1 FROM waitlist WHERE email = ? LIMIT 1',
      args: [trimmedEmail]
    })

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'This email is already registered on the waitlist!' },
        { status: 409 }
      )
    }

    // 4. Save email to database
    await turso.execute({
      sql: 'INSERT INTO waitlist (email) VALUES (?)',
      args: [trimmedEmail]
    })

    return NextResponse.json(
      { message: "You're successfully registered!" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error handling waitlist registration:', error)
    
    // Fallback constraint checks
    if (error.code === 'SQLITE_CONSTRAINT' || (error.message && error.message.includes('UNIQUE constraint'))) {
      return NextResponse.json(
        { error: 'This email is already registered on the waitlist!' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected database error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
