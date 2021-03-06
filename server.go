package main

import (
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/pborman/uuid"
	"log"
	//"math/rand"
	"net/http"
)

type Message struct {
	Money      int    // current money of player
	BetMoney   int    // as above, current money betted
	PlayerName string // Set name of the current player
	Id         string // the id of the player that sent the message
	// spawn a new sprite on the screens of the other players. for all subsequent
	// messages it's false
	Online bool // true if the player is no longer connected so the frontend
	// will remove it from the roster
	ObsX     int    //x coords of obs
	ObsY     int    //y coords of obs, obvsly
	Type     string // Type of obstacle being sent through.
	Finished bool   // Whether or not the player is finished with the current loop of the game.
}

type Player struct {
	Money      int    // Curent net worth of the player
	BetMoney   int    // Current money the player is betting
	Id         string // a unique id to identify the player by the frontend
	PlayerName string // self explanatory
	Online     bool
	ObsX       int
	ObsY       int
	Type       string
	Socket     *websocket.Conn // websocket connection of the player
	Finished   bool
}

func (p *Player) currency(new bool) Message {
	return Message{Money: p.Money, BetMoney: p.BetMoney, PlayerName: p.PlayerName, Id: p.Id, Online: p.Online, ObsX: p.ObsX, ObsY: p.ObsY, Type: p.Type}
}

// a slice of *Players which will store the list of connected players
var Players = make([]*Player, 0)

func remoteHandler(res http.ResponseWriter, req *http.Request) {
	var err error

	//when someone requires a ws connection we create a new player and store a
	// pointer to the connection inside player.Socket
	ws, err := websocket.Upgrade(res, req, nil, 1024, 1024)
	if _, ok := err.(websocket.HandshakeError); ok {
		http.Error(res, "Not a websocket handshake", 400)
		return
	} else if err != nil {
		log.Println(err)
		return
	}

	log.Printf("got websocket conn from %v\n", ws.RemoteAddr())
	player := new(Player)
	player.Id = uuid.New()
	player.Socket = ws
	// we broadcast the position of the new player to alredy connected
	// players (if any) and viceversa, we tell the player where to spawn already
	// existing players
	log.Println("Publishing current net worths")

	//randred := rand.Intn(1000)
	//randgreen := rand.Intn(1000)
	//randblue := rand.Intn(1000)
	//randorange := rand.Intn(1000)
	//negorpos := rand.Float64()
	go func() {
		for _, p := range Players {
			if err = player.Socket.WriteJSON(p.currency(true)); err != nil {
				log.Println(err)
			}
			/*
				if {
					player.Socket.WriteJSON(player.currency(false))
				}

					if p.Socket.RemoteAddr() != player.Socket.RemoteAddr() {
						if err = player.Socket.WriteJSON(p.currency(false)); err != nil {
							log.Println(err)
						}
						if err = p.Socket.WriteJSON(player.currency(true)); err != nil {
							log.Println(err)
						}
					}*/
		}
	}()

	// we append the new player to Players slice
	Players = append(Players, player)
	for {
		// if a network error occurs (aka someone closed the game) we let
		// the other players know to despawn his sprite (Online: false) and
		// remove him from the slice so no further updates will be sent
		if err = player.Socket.ReadJSON(&player); err != nil {
			log.Println("Player Disconnected waiting", err)
			for i, p := range Players {
				if p.Socket.RemoteAddr() == player.Socket.RemoteAddr() {
					Players = append(Players[:i], Players[i+1:]...)
				} else {
					log.Println("destroy player", player)
					if err = p.Socket.WriteJSON(p.currency(false)); err != nil {
						log.Println(err)
					}
				}
			}
			log.Println("Number of players still connected ...", len(Players))
			return
		}

		// a regular broadcast to inform all the players about a player's
		// position update
		go func() {
			for _, p := range Players {
				if p.Socket.RemoteAddr() != player.Socket.RemoteAddr() {
					if err = p.Socket.WriteJSON(player.currency(true)); err != nil {
						log.Println(err)
					}
				}

			}
			/*
				var Json JsonData
				if player.Socket.ReadJSON(&Json); err != nil {
					log.Println(err)
				}
				if Json.Finished && Json.Finished == true {
					for _, p := range Players {
						if err = p.WriteMessage(ws.TextMessage, "finished"); err != nil {
							log.Println(err)
						}
					}
					Json.Finished = false
			*/
		}()
	}
}

func serve(w http.ResponseWriter, r *http.Request) {
	file := r.URL.Path
	http.ServeFile(w, r, "./"+file)
	log.Print(r.Method, " ", file)
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/ws", remoteHandler)

	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./")))
	http.ListenAndServe(":8000", r)
	http.HandleFunc("/", serve)
	/*
		err := http.ListenAndServe(":80", nil)
		if err != nil {
			log.Fatal(err)
		}
	*/
}
