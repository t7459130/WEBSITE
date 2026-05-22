import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import youtubedl from 'youtube-dl-exec'

ffmpeg.setFfmpegPath(ffmpegPath)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const runtime = 'nodejs'

export async function POST(req) {

  try {

    const { youtubeUrl } = await req.json()

    if (!youtubeUrl) {
      return NextResponse.json({
        error: 'No YouTube URL provided'
      }, { status: 400 })
    }

    // Get stream info
    const info = await youtubedl(
      youtubeUrl,
      {
        dumpSingleJson: true,
        noWarnings: true,
        preferFreeFormats: true
      }
    )

    const audioUrl =
      info.url || info.formats?.[0]?.url

    if (!audioUrl) {
      return NextResponse.json({
        error: 'Could not extract audio stream'
      }, { status: 500 })
    }

    // Temp file
    const outputFile =
      path.join('/tmp', 'audio.wav')

    // Convert first 20 sec to wav
    await new Promise((resolve, reject) => {

      ffmpeg(audioUrl)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .duration(20)
        .format('wav')
        .save(outputFile)
        .on('end', resolve)
        .on('error', reject)

    })

    // Send to Whisper
    const transcription =
      await openai.audio.transcriptions.create({
        file: fs.createReadStream(outputFile),
        model: 'whisper-1'
      })

    return NextResponse.json({
      success: true,
      text: transcription.text
    })

  } catch (err) {

    console.error(err)

    return NextResponse.json({
      error: err.message
    }, { status: 500 })

  }

}