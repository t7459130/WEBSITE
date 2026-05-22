'use client'

import { useState } from 'react'

export default function Home() {

  const [url, setUrl] = useState('')
  const [captions, setCaptions] = useState([])
  const [loading, setLoading] = useState(false)

  const start = async () => {

    if (!url) {
      setCaptions(['Please paste a YouTube URL'])
      return
    }

    setLoading(true)
    setCaptions(['Processing...'])

    try {

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          youtubeUrl: url
        })
      })

      const data = await response.json()

      console.log('API RESPONSE:', data)

      if (!response.ok) {

        setCaptions([
          '❌ ERROR:',
          JSON.stringify(data, null, 2)
        ])

        setLoading(false)
        return
      }

      setCaptions([
        data.text || data.message || JSON.stringify(data, null, 2)
      ])

    } catch (err) {

      setCaptions([
        '❌ CLIENT ERROR:',
        err.message
      ])

    } finally {

      setLoading(false)

    }

  }

  const extractVideoId = (url) => {

    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/

    const match = url.match(regExp)

    return match && match[2].length === 11
      ? match[2]
      : null
  }

  const videoId = extractVideoId(url)

  return (
    <main style={{
      padding: 20,
      fontFamily: 'Arial'
    }}>

      <h1>🕋 Kaaba Live Translator</h1>

      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder='Paste YouTube livestream URL'
        style={{
          width: '100%',
          padding: 12,
          marginTop: 10
        }}
      />

      <button
        onClick={start}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: 12,
          cursor: 'pointer'
        }}
      >
        {loading ? 'Processing...' : 'Start Translation'}
      </button>

      {videoId && (
        <div style={{ marginTop: 20 }}>

          <iframe
            width='100%'
            height='500'
            src={`https://www.youtube.com/embed/${videoId}`}
            allowFullScreen
          />

        </div>
      )}

      <div
        style={{
          marginTop: 20,
          background: '#000',
          color: '#00ff00',
          padding: 20,
          borderRadius: 10,
          minHeight: 150,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word'
        }}
      >

        {captions.length === 0
          ? 'Captions will appear here...'
          : captions.map((c, i) => (
              <p key={i}>{c}</p>
            ))
        }

      </div>

    </main>
  )
}