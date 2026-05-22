import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import OpenAI from 'openai'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import youtubedl from 'youtube-dl-exec'
import fs from 'fs'
import path from 'path'

dotenv.config()

ffmpeg.setFfmpegPath(ffmpegPath)

const app = express()

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Backend running')
})

io.on('connection', (socket) => {

  console.log('Client connected')

  socket.on('start-transcription', async ({ youtubeUrl }) => {

    try {

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
        socket.emit('caption', 'Could not extract audio')
        return
      }

      let counter = 0

      const interval = setInterval(async () => {

        try {

          const outputFile =
            path.join(process.cwd(), `chunk-${counter}.wav`)

          await new Promise((resolve, reject) => {

            ffmpeg(audioUrl)
              .audioCodec('pcm_s16le')
              .audioChannels(1)
              .audioFrequency(16000)
              .duration(15)
              .format('wav')
              .save(outputFile)
              .on('end', resolve)
              .on('error', reject)

          })

          const transcription =
            await openai.audio.transcriptions.create({
              file: fs.createReadStream(outputFile),
              model: 'whisper-1'
            })

          socket.emit(
            'caption',
            transcription.text
          )

          fs.unlinkSync(outputFile)

          counter++

        } catch (err) {

          socket.emit(
            'caption',
            'ERROR: ' + err.message
          )

        }

      }, 20000)

      socket.on('disconnect', () => {
        clearInterval(interval)
      })

    } catch (err) {

      socket.emit(
        'caption',
        'SERVER ERROR: ' + err.message
      )

    }

  })

})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})