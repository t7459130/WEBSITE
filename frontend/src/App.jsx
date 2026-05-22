import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');

  const sendMessage = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/api/chat`, {
        message,
      });

      setReply(data.reply);
    } catch (err) {
      console.error(err);
      setReply('Error connecting to backend');
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Kaaba Translation</h1>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        cols={50}
        placeholder="Enter Arabic text"
      />

      <br /><br />

      <button onClick={sendMessage}>
        Translate
      </button>

      <h2>Translation</h2>

      <p>{reply}</p>
    </div>
  );
}