import { create } from 'zustand';
import { io } from 'socket.io-client';

interface ChatStoreState {
  messages: Array<any>;
  room: string;
  user: string;
  socket: any | null;
  isConnected: boolean;
  connectSocket: () => void;
  disconnectSocket: () => void;
  joinRoom: (room: string) => void;
  sendMessage: (text: string) => void;
  setUser: (user: string) => void;
}

const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  room: 'general',
  user: 'Anonymous',
  socket: null,
  isConnected: false,

  connectSocket: () => {
    const socket = io(process.env.REACT_APP_SERVER_URL, {
      withCredentials: true,
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      console.log('Socket connected');
    });

    socket.on('receive_message', (newMessage) => {
      set((state) => ({ messages: [...state.messages, newMessage] }));
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  joinRoom: (room) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join_room', room);
      set({ room });
    }
  },

  sendMessage: (text) => {
    const { socket, room, user } = get();
    if (socket && text.trim()) {
      socket.emit('send_message', { room, user, text });
    }
  },

  setUser: (user) => set({ user }),
}));

export default useChatStore;