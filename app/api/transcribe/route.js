import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req) {

  try {

    const { youtubeUrl } = await req.json()

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'No URL received' }, { status: 400 })
    }

    // TEST RESPONSE FIRST (to confirm pipeline works)
    return NextResponse.json({
      message: 'Backend working',
      text: 'Live transcription will appear here once audio processing is enabled',
      url: youtubeUrl
    })

  } catch (err) {

    return NextResponse.json({
      error: err.message
    }, { status: 500 })

  }
}