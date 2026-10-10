import { useState, useEffect } from 'react';
import axios from 'axios';

interface ChatProps {
  credentials: {
    idInstance: string;
    apiTokenInstance: string;
  };
}

interface Message {
  id: string; // Changed from number to string
  text: string;
  isMine: boolean;
  timestamp: string;
}

function Chat({ credentials }: ChatProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  // ================================
  // POLLING FOR INCOMING MESSAGES
  // ================================
useEffect(() => {
  if (!currentChat) return;

  const interval = setInterval(async () => {
    try {
      const url = `https://api.green-api.com/waInstance${credentials.idInstance}/receiveNotification/${credentials.apiTokenInstance}`;
      
      const response = await axios.get(url, {
        validateStatus: (status) => status >= 200 && status < 500
      });

      if (response.status === 408) return; // Queue empty, wait

      if (response.data && response.data.body) {
        const notification = response.data;
        const receiptId = notification.receiptId;
        const messageBody = notification.body;

        // Delete immediately
        await axios.delete(
          `https://api.green-api.com/waInstance${credentials.idInstance}/deleteNotification/${credentials.apiTokenInstance}/${receiptId}`
        );

    // Ignore outgoing messages when clicking Send.
        if (messageBody.typeWebhook === 'outgoingAPIMessageReceived') {
          return;
        }

        // AGGRESSIVE PARSING FOR MAX, WHATSAPP, AND TELEGRAM
        let text = null;
        if (messageBody.messageData) {
          if (messageBody.messageData.textMessageData) {
            text = messageBody.messageData.textMessageData.textMessage;
          } else if (messageBody.messageData.extendedTextMessageData) {
            text = messageBody.messageData.extendedTextMessageData.text;
          }
        }

        if (text) {

          // 🛑 THE FIX: Use the API's unique idMessage instead of Date.now()
          const apiMessageId = messageBody.idMessage || Date.now().toString();

          const newMessage: Message = {
            id: apiMessageId, 
            text: text,
            isMine: false, 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          
        setMessages((prev) => {
          // Skip if we already have a message with this ID
          if (prev.some(msg => msg.id === apiMessageId)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 3000);

  return () => clearInterval(interval);
}, [currentChat, credentials]);

  // ================================
  // SENDING A MESSAGE
  // ================================
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentChat) return;

    // Group chats start with "-", individual chats need "@c.us"
    const chatId = currentChat.startsWith('-')
      ? currentChat
      : `${currentChat}@c.us`;

    const url = `https://api.green-api.com/waInstance${credentials.idInstance}/sendMessage/${credentials.apiTokenInstance}`;
    const body = {
      chatId: chatId,
      message: messageText,
    };

    try {
      await axios.post(url, body);

      // ADD THE SENT MESSAGE TO THE UI!
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isMine: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setMessages((prev) => [...prev, newMessage]);
      setMessageText('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Check the console for details.');
    }
  };

  // ================================
  // CREATING A NEW CHAT
  // ================================
  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      setCurrentChat(phoneNumber);
      setMessages([]);
    }
  };

  // ================================
  // UI
  // ================================
  return (
    <div className="chat-app">
      <div className="sidebar">
        <h3>Chats</h3>
        <form onSubmit={handleCreateChat} className="new-chat-form">
          <input
            type="text"
            placeholder="Phone number (e.g. 79999999999)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button type="submit">Start Chat</button>
        </form>
        {currentChat && (
          <div className="chat-list-item active">
            <div className="avatar">👤</div>
            <div className="chat-info">
              <span className="chat-name">{currentChat}</span>
              <span className="chat-preview">Click to view</span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-area">
        {currentChat ? (
          <>
            <div className="chat-header">
              <h3>{currentChat}</h3>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-state">No messages yet. Say hi!</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`message-bubble ${msg.isMine ? 'mine' : 'theirs'}`}>
                    <div className="message-text">{msg.text}</div>
                    <div className="message-time">{msg.timestamp}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="empty-state">Select or start a new chat to begin</div>
        )}
      </div>
    </div>
  );
}

export default Chat;