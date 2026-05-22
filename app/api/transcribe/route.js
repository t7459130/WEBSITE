import { NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

export const runtime = 'nodejs'

export async function POST(req) {

  try {

    const { youtubeUrl } = await req.json()

    if (!youtubeUrl) {
      return NextResponse.json({
        error: 'No YouTube URL'
      }, { status: 400 })
    }

    const videoId = extractVideoId(youtubeUrl)

    if (!videoId) {
      return NextResponse.json({
        error: 'Invalid YouTube URL'
      }, { status: 400 })
    }

    const transcript =
      await YoutubeTranscript.fetchTranscript(videoId)

    const text =
      transcript
        .map(t => t.text)
        .join(' ')

    return NextResponse.json({
      success: true,
      text
    })

  } catch (err) {

    return NextResponse.json({
      error: err.message
    }, { status: 500 })

  }

}

function extractVideoId(url) {

  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/

  const match = url.match(regExp)

  return match && match[2].length === 11
    ? match[2]
    : null
}