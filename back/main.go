package main

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

type Message struct {
	Type   string      `json:"type"`
	Board  [9]*string  `json:"board,omitempty"`
	Turn   string      `json:"turn,omitempty"`
	Winner interface{} `json:"winner,omitempty"`
	Room   string      `json:"room,omitempty"`
	Player string      `json:"player,omitempty"`
	Name   string      `json:"name,omitempty"`
}

type Room struct {
	ID      string
	Players map[*websocket.Conn]string
	Names   map[string]string
	Board   [9]*string
	Turn    string
	Winner  interface{}
	Mutex   sync.Mutex
}

type RoomInfo struct {
	ID      string   `json:"id"`
	Players []string `json:"players"`
}

var rooms = make(map[string]*Room)
var roomsMutex = sync.Mutex{}

func main() {
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH",
	}))

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		var currentRoom *Room
		var player string
		var playerName string

		defer func() {
			if currentRoom != nil {
				currentRoom.Mutex.Lock()
				delete(currentRoom.Players, c)
				if len(currentRoom.Players) == 0 {
					roomsMutex.Lock()
					delete(rooms, currentRoom.ID)
					roomsMutex.Unlock()
				} else {
					for conn := range currentRoom.Players {
						err := conn.WriteJSON(Message{Type: "disconnect"})
						if err != nil {
							log.Println("Error writing disconnect message:", err)
							conn.Close()
							delete(currentRoom.Players, conn)
						}
					}
				}
				currentRoom.Mutex.Unlock()
			}
			c.Close()
		}()

		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				log.Println("Error reading message:", err)
				break
			}

			var message Message
			if err := json.Unmarshal(msg, &message); err != nil {
				log.Println("Error unmarshaling message:", err)
				break
			}

			

			switch message.Type {
			case "join":
				log.Println("Joining room", message.Room)
				roomsMutex.Lock()
				room, exists := rooms[message.Room]

				if !exists {
					log.Println("Creating room", message.Room)
					room = &Room{
						ID:      message.Room,
						Players: make(map[*websocket.Conn]string),
						Names:   make(map[string]string),
						Board:   [9]*string{},
						Turn:    "x",
					}
					rooms[message.Room] = room
				}
				roomsMutex.Unlock()
				log.Print("----------------------")
				jsonData, _ := json.MarshalIndent(rooms, "", "    ")
				log.Println(jsonData)
				log.Println("---------------------")

				room.Mutex.Lock()
				if len(room.Players) < 2 {
					if len(room.Players) == 0 {
						player = "x"
					} else {
						player = "o"
					}
					room.Players[c] = player
					room.Names[player] = message.Name
					playerName = message.Name
					currentRoom = room
					err := c.WriteJSON(Message{Type: "assign_player", Player: player, Name: playerName})
					if err != nil {
						log.Println("Error assigning player:", err)
						room.Mutex.Unlock()
						break
					}
				} else {
					err := c.WriteJSON(Message{Type: "full"})
					if err != nil {
						log.Println("Error writing full message:", err)
					}
					room.Mutex.Unlock()
					break
				}
				room.Mutex.Unlock()

			case "move":
				if currentRoom == nil {
					log.Println("currentRoom is nil on move")
					break
				}
				currentRoom.Mutex.Lock()
				currentRoom.Board = message.Board
				currentRoom.Turn = message.Turn
				currentRoom.Winner = message.Winner
				for conn := range currentRoom.Players {
					err := conn.WriteJSON(Message{
						Type:   "update",
						Board:  currentRoom.Board,
						Turn:   currentRoom.Turn,
						Winner: currentRoom.Winner,
						Name:   currentRoom.Names[currentRoom.Turn],
					})
					if err != nil {
						log.Println("Error writing update message:", err)
						conn.Close()
						delete(currentRoom.Players, conn)
					}
				}
				currentRoom.Mutex.Unlock()

			case "reset":
				if currentRoom == nil {
					log.Println("currentRoom is nil on reset")
					break
				}
				currentRoom.Mutex.Lock()
				currentRoom.Board = [9]*string{}
				currentRoom.Turn = "x"
				currentRoom.Winner = nil
				for conn := range currentRoom.Players {
					err := conn.WriteJSON(Message{
						Type:   "update",
						Board:  currentRoom.Board,
						Turn:   currentRoom.Turn,
						Winner: currentRoom.Winner,
						Name:   currentRoom.Names[currentRoom.Turn],
					})
					if err != nil {
						log.Println("Error writing reset message:", err)
						conn.Close()
						delete(currentRoom.Players, conn)
					}
				}
				currentRoom.Mutex.Unlock()
			}
		}
	}))

	app.Get("/rooms", func(c *fiber.Ctx) error {
		roomsMutex.Lock()
		defer roomsMutex.Unlock()

		var roomInfos []RoomInfo
		for id, room := range rooms {
			room.Mutex.Lock()
			var players []string
			for _, player := range room.Names {
				players = append(players, player)
			}
			roomInfos = append(roomInfos, RoomInfo{
				ID:      id,
				Players: players,
			})
			room.Mutex.Unlock()
		}
		return c.JSON(roomInfos)
	})

	log.Fatal(app.Listen(":3000"))
}
