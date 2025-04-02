import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Create socket connection outside the component
const socket = io('http://localhost:5002');

const useChatStore = create()(
  persist(
    (set, get) => ({
      messages: [],
      room: 'general',
      user: 'Anonymous',
      isConnected: false,
      
      connectSocket: () => {
        socket.on('connect', () => {
          set({ isConnected: true });
          console.log('Connected to server');
        });

        socket.on('disconnect', () => {
          set({ isConnected: false });
        });

        socket.on('receive_message', (newMessage) => {
          // Ensure timestamp is a Date object
          const messageWithDate = {
            ...newMessage,
            timestamp: new Date(newMessage.timestamp)
          };
          set((state) => ({
            messages: [...state.messages, messageWithDate],
          }));
        });
      },
      
      disconnectSocket: () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('receive_message');
      },
      
      joinRoom: (room) => {
        socket.emit('join_room', room);
        set({ room });
      },
      
      sendMessage: (message) => {
        const { room, user } = get();
        if (message.trim()) {
          const msgData = {
            room,
            user,
            text: message,
            timestamp: new Date() // Always use Date object
          };
          socket.emit('send_message', msgData);
        }
      },
      
      setUser: (user) => set({ user }),
    }),
    {
      name: 'chat-storage',
    }
  )
);

const App = () => {
  const {
    messages,
    room,
    user,
    isConnected,
    connectSocket,
    disconnectSocket,
    joinRoom,
    sendMessage,
    setUser,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Format timestamp for display
  const formatTime = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return 'Invalid Date';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Styles
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      borderRadius: '10px',
      height: '90vh',
      display: 'flex',
      flexDirection: 'column',
    },
    status: {
      padding: '10px',
      backgroundColor: isConnected ? '#e6f7e6' : '#ffebeb',
      color: isConnected ? 'green' : 'red',
      borderRadius: '5px',
      marginBottom: '15px',
      textAlign: 'center',
      fontWeight: 'bold',
    },
    roomSelector: {
      display: 'flex',
      gap: '10px',
      marginBottom: '15px',
    },
    input: {
      flex: 1,
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      fontSize: '14px',
    },
    messages: {
      flex: 1,
      overflowY: 'auto',
      backgroundColor: 'white',
      borderRadius: '5px',
      padding: '15px',
      marginBottom: '15px',
      border: '1px solid #eee',
    },
    message: {
      marginBottom: '10px',
      padding: '8px 12px',
      backgroundColor: '#e9f5ff',
      borderRadius: '8px',
    },
    messageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '5px',
    },
    user: {
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    time: {
      fontSize: '0.8em',
      color: '#7f8c8d',
    },
    inputContainer: {
      display: 'flex',
      gap: '10px',
    },
    messageInput: {
      flex: 1,
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      fontSize: '14px',
    },
    sendButton: {
      padding: '10px 20px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
    },
  };

  // Initialize socket connection
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, [connectSocket, disconnectSocket]);

  // Join room when room changes
  useEffect(() => {
    if (isConnected) {
      joinRoom(room);
    }
  }, [room, isConnected, joinRoom]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput('');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.status}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <div style={styles.roomSelector}>
        <input
          type="text"
          value={room}
          onChange={(e) => useChatStore.setState({ room: e.target.value })}
          placeholder="Room name"
          style={styles.input}
        />
        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="Your name"
          style={styles.input}
        />
      </div>

      <div style={styles.messages}>
        {messages.map((msg, index) => (
          <div key={index} style={styles.message}>
            <div style={styles.messageHeader}>
              <span style={styles.user}>{msg.user}</span>
              <span style={styles.time}>{formatTime(msg.timestamp)}</span>
            </div>
            <div>{msg.text}</div>
          </div>
        ))}
      </div>

      <div style={styles.inputContainer}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          style={styles.messageInput}
        />
        <button 
          onClick={handleSendMessage}
          style={styles.sendButton}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default App;