import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { startTranscription } from './transcriber.js'

dotenv.config()

const app = express()

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Realtime transcription server running')
})

io.on('connection', socket => {
  console.log('Client connected')

  socket.on('start-stream', async data => {
    try {
      const { youtubeUrl } = data

      await startTranscription(youtubeUrl, text => {
        socket.emit('transcript', text)
      })

    } catch (err) {
      console.error(err)

      socket.emit('error-message', err.message)
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected')
  })
})

const PORT = 3001

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})