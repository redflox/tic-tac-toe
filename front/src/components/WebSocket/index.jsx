import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const WebSocketComponent = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const socket = useRef();

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:3000/ws");

    socket.current.onopen = () => {
      console.log("Connected to server");
    };

    socket.current.onmessage = (event) => {
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    socket.current.onclose = () => {
      console.log("Disconnected from server");
    };

    return () => {
      socket.current.close();
    }
  }, []);

   const sendMessage = () => {
    if (message) {
      socket.current.send(message);
      setMessage("");
    }
  };

  return (
    <>
      <h1>WebSocket Prueba</h1>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>ENVIAR</button>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
    </>
  );
};

export default WebSocketComponent;