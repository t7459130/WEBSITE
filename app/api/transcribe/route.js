import { NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import youtubedl from 'youtube-dl-exec'

ffmpeg.setFfmpegPath(ffmpegPath)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const runtime = 'nodejs'

export async function POST(req) {

  try {

    const { youtubeUrl } = await req.json()

    const encoder = new TextEncoder()

    const stream = new ReadableStream({

      async start(controller) {

        try {

          const info = await youtubedl(
            youtubeUrl,
            {
              dumpSingleJson: true
            }
          )

          const audioUrl =
            info.url || info.formats?.[0]?.url

          const outputFile =
            path.join('/tmp', 'audio.wav')

          ffmpeg(audioUrl)
            .audioCodec('pcm_s16le')
            .audioChannels(1)
            .audioFrequency(16000)
            .duration(15)
            .format('wav')
            .save(outputFile)
            .on('end', async () => {

              try {

                const transcription =
                  await openai.audio.transcriptions.create({
                    file: fs.createReadStream(outputFile),
                    model: 'whisper-1'
                  })

                controller.enqueue(
                  encoder.encode(
                    transcription.text + '\\n'
                  )
                )

                controller.close()

              } catch (err) {

                controller.error(err)

              }

            })

        } catch (err) {

          controller.error(err)

        }

      }

    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain'
      }
    })

  } catch (err) {

    return NextResponse.json({
      error: err.message
    })

  }

}