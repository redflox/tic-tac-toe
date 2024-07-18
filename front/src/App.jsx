import { useState, useRef, useEffect } from "react";
import Square from "./components/Square";

const TURNS = {
  X: "x",
  O: "o",
};

const WINNING_PLAYS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState(TURNS.X);
  const [winner, setWinner] = useState(undefined);
  const [roomId, setRoomId] = useState("");
  const [player, setPlayer] = useState(null); // 'x' or 'o'
  const [playerName, setPlayerName] = useState(""); // Name of the player
  const [turnName, setTurnName] = useState(""); // Name of the player whose turn it is
  const socket = useRef();

  useEffect(() => {
    const connectWebSocket = () => {
      socket.current = new WebSocket("ws://localhost:3000/ws");

      socket.current.onopen = () => {
        console.log("Connected to server");
      };

      socket.current.onmessage = (event) => {
        console.log("Message from server", event.data);
        const data = JSON.parse(event.data);
        if (data.type === 'update') {
          setBoard(data.board);
          setTurn(data.turn);
          setWinner(data.winner);
          setTurnName(data.name); // Update the turn name
        } else if (data.type === 'assign_player') {
          setPlayer(data.player);
        } else if (data.type === 'disconnect') {
          setWinner(player === 'x' ? 'o' : 'x');
        }
      };

      socket.current.onclose = (event) => {
        console.log(`Disconnected from server: ${event.code} - ${event.reason}`);
        if (!event.wasClean) {
          console.log('Attempting to reconnect...');
          setTimeout(connectWebSocket, 1000); // Reintentar conexión después de 1 segundo
        }
      };

      socket.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    connectWebSocket();

    return () => {
      console.log("Disconnected from server");
      socket.current.close();
    };
  }, [player, roomId]);

  const joinRoom = () => {
    const roomId = prompt("Enter room ID:");
    setRoomId(roomId);
    if (socket.current.readyState === WebSocket.OPEN) {
      const name = prompt("Enter your name:");
      setPlayerName(name);
      socket.current.send(JSON.stringify({ type: 'join', room: roomId, name }));
      console.log("SEND", { type: 'join', room: roomId, name })
    }
  };

  const checkWinner = (newBoard) => {
    for (const win_play of WINNING_PLAYS) {
      const [a, b, c] = win_play;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a];
      }
    }
    return newBoard.every(square => square != null) ? false : null;
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setTurn(TURNS.X);
    setWinner(null);
    socket.current.send(JSON.stringify({
      type: "reset",
      room: roomId,
    }));
  };

  const onChangeBoard = (index) => {
    if (winner || board[index] || turn !== player) return;

    const newBoard = [...board];
    newBoard[index] = turn;

    const newWinner = checkWinner(newBoard);
    const newTurn = turn === TURNS.X ? TURNS.O : TURNS.X;

    setBoard(newBoard);
    setTurn(newTurn);
    setWinner(newWinner);

    socket.current.send(JSON.stringify({
      type: "move",
      board: newBoard,
      turn: newTurn,
      winner: newWinner,
      room: roomId,
    }));
  };

  return (
    <main className="board">
      <h1>Tic Tac Toe</h1>
      {!roomId && <button onClick={joinRoom} className='win'>Join Room</button>}
      {roomId && (
        <>
          <section>
            <button onClick={resetGame} className='win'>RESETEAR</button>
          </section>
          <section>
            <p>winner: {winner}</p>
            <p>Room ID: {roomId}</p>
            <p>Player: {playerName}</p>
            <p>Turno: {turnName}</p>
          </section>
          <br/>
          <section className="game">
            {board.map((player, index) => (
              <Square
                key={index}
                handleChange={onChangeBoard}
                index={index}
              >
                {player}
              </Square>
            ))}
          </section>
          <section className="turn">
            <div className={`square ${TURNS.O === turn ? 'is-selected' : ''}`}>{TURNS.O}</div>
            <div className={`square ${TURNS.X === turn ? 'is-selected' : ''}`}>{TURNS.X}</div> 
          </section>
          {winner !== undefined && (
            <section className="winner">
              <p className='text'>{winner ? `Winner: ${winner}` : 'EMPATE'}</p>
              <button onClick={resetGame} className='win'>Volver a jugar</button>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default App;
