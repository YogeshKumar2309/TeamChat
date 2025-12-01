import { useRef, useState } from "react";
import ChatCart from "../../components/common/ChatCart";

const Home = () => {
  const messagesEndRef = useRef(null);

  const [page, setPage] = useState(1);
  const [newMessage, setNewMessage] = useState("");

  const [currentChannel, setCurrentChannel] = useState({
    id: "general",
    name: "General Chat"
  });

  const [onlineUsers, setOnlineUsers] = useState([
    "Yogesh", "Rohan", "Priya", "Amit"
  ]);

  const [messages, setMessages] = useState({
    general: [
      {
        id: "msg1",
        user: "Amit",
        text: "Hi everyone 👋",
        timestamp: Date.now() - 600000
      },
      {
        id: "msg2",
        user: "Priya",
        text: "Hello Amit! Kaise ho?",
        timestamp: Date.now() - 540000
      },
      {
        id: "msg3",
        user: "Rohan",
        text: "Database design ka plan bn gaya kya?",
        timestamp: Date.now() - 400000
      },
      {
        id: "msg4",
        user: "Yogesh",
        text: "Haa bro, practice chalu hai 💪",
        timestamp: Date.now() - 200000
      }
    ]
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    setMessages(prev => ({
      ...prev,
      [currentChannel.id]: [
        ...prev[currentChannel.id],
        {
          id: "msg" + Date.now(),
          user: "Yogesh",
          text: newMessage,
          timestamp: Date.now()
        }
      ]
    }));

    setNewMessage("");
    setTimeout(()=> messagesEndRef.current?.scrollIntoView({ behavior: "smooth"}),100)
  };

  const loadMoreMessages = () => {
    alert("Dummy: Loading older messages...")
    setPage(page + 1);
  };

  return (
    <ChatCart
      currentChannel={currentChannel}
      messages={messages}
      page={page}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      handleSendMessage={handleSendMessage}
      loadMoreMessages={loadMoreMessages}
      onlineUsers={onlineUsers}
      messagesEndRef={messagesEndRef}
    />
  );
};

export default Home;
