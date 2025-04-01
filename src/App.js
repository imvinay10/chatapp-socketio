import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5001'); // bckend URL

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    const handleMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };
  
    socket.on('receive_message', handleMessage);
    return () => {
      socket.off('receive_message', handleMessage);
      socket.disconnect();
    };
  }, []); 

  const sendMessage = () => {
    if (message.trim() === "") return;
    socket.emit('send_message', { message });
    setMessage('');
  };

  return (
    <div>
      <h1>Real-Time Chat</h1>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>{msg.message}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;