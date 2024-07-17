package main

import (
	"fmt"
	"log"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	// Ruta para la página principal que responde con "Hello, World!"
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	// Ruta para manejar conexiones WebSocket
	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		// Imprime la información del host local
		fmt.Println(c.Locals("Host"))

		// Bucle infinito para manejar mensajes WebSocket
		for {
			// Lee un mensaje del WebSocket
			mt, msg, err := c.ReadMessage()
			if err != nil {
				log.Println("read:", err)
				break
			}
			log.Printf("recv: %s", msg)

			// Escribe el mismo mensaje de vuelta al WebSocket
			err = c.WriteMessage(mt, msg)
			if err != nil {
				log.Println("write:", err)
				break
			}
		}
	}))

	// Inicia el servidor en el puerto 3000 y registra cualquier error fatal
	log.Fatal(app.Listen(":3000"))
}
