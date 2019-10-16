package main

import (
	"log"

	IPC "github.com/Akumzy/ipc"
)

var ipc = IPC.New()

func main() {
	log.Println("Yes")
	// Start your app in a new goroutine
	go app()
	// This will run forever
	ipc.Start()
}

// Start your app here
func app() {
	ipc.OnReceiveAndReply("app:ready", func(channel string, data interface{}) {
		ipc.Reply(channel, "ready", nil)
	})
}
