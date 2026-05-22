import { spawn } from 'child_process'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

ffmpeg.setFfmpegPath(ffmpegPath)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function startTranscription(youtubeUrl, onTranscript) {

  const yt = spawn('yt-dlp', [
    '-f',
    'bestaudio',
    '-o',
    '-',
    youtubeUrl
  ])

  const outputFile = path.join(process.cwd(), 'chunk.wav')

  ffmpeg(yt.stdout)
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

        onTranscript(transcription.text)

      } catch (err) {
        console.error(err)
      }

    })
}