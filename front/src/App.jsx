import { useState } from 'react'
import Square from './components/Square'

const TURNS = {
  X: 'x',
  O: 'o'
}

const WINNING_PLAYS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
]

const board = Array(9).fill(null)

function App() {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [turn, setTurn] = useState(TURNS.X)
  const [winner, setWinner] = useState(null)

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setTurn(TURNS.X)
    setWinner(null)
  }

  const onChangeBoard = (index) => {
    // Se verifica si hay un ganador
    if (winner) return

    // Verifica si la casilla ya tiene un valor asignado
    if (board[index]) return

    // Actualiza el board
    const newBoard = [...board]
    newBoard[index] = turn
    setBoard(newBoard)

    //verifica si hay un ganador o empate
    WINNING_PLAYS.forEach(win_play => {
      if (
        newBoard[win_play[0]] === turn &&
        newBoard[win_play[1]] === turn &&
        newBoard[win_play[2]] === turn
      ) {
        setWinner(turn)
      } else if (newBoard.every(square => square !== null)) { setWinner(false) }
    })


    // Actualizando el turno
    setTurn(turn === TURNS.X ? TURNS.O : TURNS.X)
  }

  return (
    <main className="board">
      <h1>Tic Tac Toe</h1>
      <section>
      <button onClick={resetGame} className='win'>RESETEAR</button>
      </section>
      <section className="game">
        {
          board.map((player, index) => {
            return (
              <Square
                key={index}
                handleChange={onChangeBoard}
                index={index}
              >
                {player}
              </Square>
            )
          })
        }
      </section>
     
      <section className="turn">
        <div className={`square ${TURNS.O == turn ? 'is-selected':''}`}>{ TURNS.O }</div>
        <div className={`square ${TURNS.X == turn ? 'is-selected':''}`}>{ TURNS.X }</div>
      </section>

      {
        winner ?
          <section className="winner">
            <p className='text'>Winner: {winner}</p>
            <button onClick={resetGame} className='win'>Volver a jugar</button>
          </section>
          :
          winner == false ?
            <section className="winner">
              <p className='text'>EMPATE</p>
              <button onClick={resetGame} className='win'>Volver a jugar</button>
            </section>
            :
            <>
            </>
      }

    </main>
  )
}

export default App
