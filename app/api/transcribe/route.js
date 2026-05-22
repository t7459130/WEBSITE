import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const runtime = 'nodejs'

export async function POST(req) {

  try {

    const { youtubeUrl } = await req.json()

    if (!youtubeUrl) {
      return NextResponse.json({
        error: 'No URL provided'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'API route working',
      url: youtubeUrl
    })

  } catch (err) {

    return NextResponse.json({
      error: err.message
    })

  }

}