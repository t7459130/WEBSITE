'use client'

import { useState } from 'react'

export default function Home() {

  const [url, setUrl] = useState('')
  const [captions, setCaptions] = useState([])

  const start = async () => {

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        youtubeUrl: url
      })
    })

    const reader = response.body.getReader()

    const decoder = new TextDecoder()

    while (true) {

      const { done, value } = await reader.read()

      if (done) break

      const chunk = decoder.decode(value)

      setCaptions(prev => [...prev, chunk])

    }

  }

  const extractVideoId = url => {

     const regExp =
         /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    return match && match[2].length === 11
      ? match[2]
      : null
  }

  const videoId = extractVideoId(url)

  return (
    <main style={{ padding: 20 }}>

      <h1>Kaaba Live Translator</h1>

      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder='Paste YouTube livestream URL'
        style={{
          width: '100%',
          padding: 12
        }}
      />

      <button
        onClick={start}
        style={{
          marginTop: 10,
          padding: 12
        }}
      >
        Start
      </button>

      {videoId && (
        <iframe
          width='100%'
          height='500'
          src={`https://www.youtube.com/embed/${videoId}`}
          style={{ marginTop: 20 }}
          allowFullScreen
        />
      )}

      <div
        style={{
          marginTop: 20,
          background: '#111',
          color: '#0f0',
          padding: 20
        }}
      >

        {captions.map((c, i) => (
          <p key={i}>{c}</p>
        ))}

      </div>

    </main>
  )
}