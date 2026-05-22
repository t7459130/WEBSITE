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

    console.log('Fetching YouTube stream...')

    const info = await youtubedl(
      youtubeUrl,
      {
        dumpSingleJson: true,
        noWarnings: true,
        preferFreeFormats: true
      }
    )

    console.log('YouTube info fetched')

    const audioUrl =
      info.url || info.formats?.[0]?.url

    if (!audioUrl) {
      return NextResponse.json({
        error: 'Could not extract audio stream'
      }, { status: 500 })
    }

    const outputFile =
      path.join('/tmp', 'audio.wav')

    console.log('Starting ffmpeg...')

    await new Promise((resolve, reject) => {

      ffmpeg(audioUrl)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .duration(20)
        .format('wav')
        .save(outputFile)
        .on('end', () => {
          console.log('ffmpeg finished')
          resolve()
        })
        .on('error', (err) => {
          console.error('ffmpeg error', err)
          reject(err)
        })

    })

    console.log('Sending to OpenAI Whisper...')

    const transcription =
      await openai.audio.transcriptions.create({
        file: fs.createReadStream(outputFile),
        model: 'whisper-1'
      })

    console.log('Transcription complete')

    return NextResponse.json({
      success: true,
      text: transcription.text
    })

  } catch (err) {

    console.error(err)

    return NextResponse.json({
      error: err.message,
      stack: err.stack
    }, { status: 500 })

  }

}