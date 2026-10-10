import { useState, useEffect } from 'react';
import axios from 'axios';

interface ChatProps {
  credentials: {
    idInstance: string;
    apiTokenInstance: string;
  };
}

interface Message {
  id: string;
  text: string;
  isMine: boolean;
  timeing: string;
}

const api = (method: string, token: string, idInstance: string, extra = '') =>
  `https://api.green-api.com/waInstance${idInstance}/${method}/${token}${extra}`;

function Chat({ credentials }: ChatProps) {
  const { idInstance, apiTokenInstance } = credentials;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  // receive messages section
  useEffect(() => {
    if (!currentChat) return;

    const poll = async () => {
      try {
        // Used to clear error messages in browser console 
        const res = await axios.get(api('receiveNotification', apiTokenInstance, idInstance), {
          validateStatus: (s) => s >= 200 && s < 500,
        });

        if (res.status === 408 || !res.data?.body) return;

        const { receiptId, body: messageBody } = res.data;

        // stop the api from repassting the output or input of messages
        await axios.delete(
          api('deleteNotification', apiTokenInstance, idInstance, `/${receiptId}`)
        );

        // to render messages locally 
        if (messageBody.typeWebhook === 'outgoingAPIMessageReceived') return;

        let text = null;
        if (messageBody.messageData?.textMessageData) {
          text = messageBody.messageData.textMessageData.textMessage;
        } else if (messageBody.messageData?.extendedTextMessageData) {
          text = messageBody.messageData.extendedTextMessageData.text;
        }

        if (!text) return;

        // idMessage achive stopping copies
        const msgId = messageBody.idMessage || Date.now().toString();
        const incoming: Message = {
          id: msgId,
          text,
          isMine: false,
          timeing: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) =>
          prev.some((m) => m.id === msgId) ? prev : [...prev, incoming]
        );
      } catch (err) {
        console.error('polling error', err);
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [currentChat, credentials]);


  // send messages section
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentChat) return;

    const chatId = currentChat.startsWith('-') ? currentChat : `${currentChat}@c.us`;

    try {
      await axios.post(api('sendMessage', apiTokenInstance, idInstance), {
        chatId,
        message: messageText,
      });

      const sent: Message = {
        id: Date.now().toString(),
        text: messageText,
        isMine: true,
        timeing: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, sent]);
      setMessageText('');
    } catch (err) {
      console.error('Ошибка отправки', err);
      alert("Не удалось отправить сообщение, проверьте консоль.");
    }
  };

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setCurrentChat(phoneNumber);
    setMessages([]);
  };

  return (
    <div className="chat-app">
      <div className="sidebar">
        <h3>Чаты</h3>
        <form onSubmit={handleCreateChat} className="new-chat-form">
          <input
            type="text"
            placeholder="Phone number (e.g. 79999999999)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button type="submit">Начать чат</button>
        </form>
        {currentChat && (
          <div className="chat-list-item active">
            <div className="avatar">👤</div>
            <div className="chat-info">
              <span className="chat-name">{currentChat}</span>
              <span className="chat-preview">Нажмите для просмотра</span>
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
              {messages.length === 0 && (
                <div className="empty-state">Сообщений пока нет. Поздоровайтесь!</div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`message-bubble ${msg.isMine ? 'mine' : 'theirs'}`}>
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{msg.timeing}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button type="submit">Отправлять</button>
            </form>
          </>
        ) : (
          <div className="empty-state">Выберите чат или начните новый, чтобы начать.</div>
        )}
      </div>
    </div>
  );
}

export default Chat;