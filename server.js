'use strict';

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from 'path';
import { fileURLToPath } from 'url';
import Player from './public/js/player.js';
import Food from './public/js/food.js';


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { pingInterval: 2000, pingTimeout: 4000 });
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename)

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

const serverPlayers = {};
const serverFood = [];

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected!`);

  serverPlayers[socket.id] = new Player(
    Math.floor((Math.random() * (1000) / 20)),
    Math.floor((Math.random() * (600) / 20))
  )
  
  io.emit('updateClientPlayers', serverPlayers, serverFood)
  
  socket.on('disconnect', (reason) => {
    console.log(reason);
    delete serverPlayers[socket.id];
    io.emit('updateClientPlayers', serverPlayers, serverFood);
  })

  socket.on('keydown', (keypress) => {
    if (keypress === "s" && serverPlayers[socket.id].previousDirection !== "UP") {
      serverPlayers[socket.id].previousDirection = "DOWN"
      serverPlayers[socket.id].direction = 'DOWN';
    } else if (keypress === "w" && serverPlayers[socket.id].previousDirection !== "DOWN") {
      serverPlayers[socket.id].previousDirection = "UP"
      serverPlayers[socket.id].direction = 'UP';
    } else if (keypress === "d" && serverPlayers[socket.id].previousDirection !== "LEFT") {
      serverPlayers[socket.id].previousDirection = "RIGHT"
      serverPlayers[socket.id].direction = 'RIGHT';
    } else if (keypress === "a" && serverPlayers[socket.id].previousDirection !== "RIGHT") {
      serverPlayers[socket.id].previousDirection = "LEFT"
      serverPlayers[socket.id].direction = 'LEFT';
    }
  })
});

setInterval(() => {
  // Update snake locations
  for (const id in serverPlayers) {
    if (serverPlayers[id].direction === 'UP') {
      serverPlayers[id].y -= 1; // and so on
    } else if (serverPlayers[id].direction === 'DOWN') {
      serverPlayers[id].y += 1; // and so on
    } else if (serverPlayers[id].direction === 'LEFT') {
      serverPlayers[id].x -= 1; // and so on
    } else if (serverPlayers[id].direction === 'RIGHT') {
      serverPlayers[id].x += 1;
    }
    serverPlayers[id].body.push([serverPlayers[id].x, serverPlayers[id].y]);
    serverPlayers[id].body.shift();
  }

  if (Object.keys(serverPlayers).length > serverFood.length){
      serverFood.push(new Food(
        Math.floor((Math.random() * (1000/20)-1)),
        Math.floor((Math.random() * (600/20)-1))
      ))
  } else if (Object.keys(serverPlayers).length < serverFood.length){
      serverFood.pop();
  }

  // Collision detection
  for (const id in serverPlayers) {
    const { x, y, body } = serverPlayers[id];
    const playerSocket = io.sockets.sockets.get(id);
    let hasEatenFood = false;
    
    // Food Detection
    for (let i = 0; i < serverFood.length; i++) {
      if (x === serverFood[i].x && y === serverFood[i].y) {
        hasEatenFood = true;
        body.push([x, y]);
        serverFood[i].x = Math.floor((Math.random() * (1000) / 20));
        serverFood[i].y = Math.floor((Math.random() * (600) / 20));
      }
    }

    if (hasEatenFood) {
      // We return because we want to skip body detection for any tick where we have eaten food
      // This way we avoid running into "ourself" when we add a new body segment
      // after eating the piece of food
      continue;
    }

    // Snake body detection
    const otherBodyParts = Object.keys(serverPlayers).flatMap((playerId) => {
      if (playerId === id) {
        const restOfTheBody = serverPlayers[playerId].body.slice(0, -1)
        return restOfTheBody // todo how to get rid of the first item in an array
      }

      return serverPlayers[playerId].body
    });

    const intersectsWithOtherPart = otherBodyParts.some((part) => {
      if (part[0] === x && part[1] === y) {
        return true;
      }
      return false;
    });

    if (intersectsWithOtherPart) {
      for (let i=0; i < 3; i++){
        body.shift();
      }
      if (body.length === 0) {
        playerSocket.emit('gameOver', true);
        playerSocket.disconnect()
      }
    }
  }

  // Handle wrapping
  for (const id in serverPlayers) {
    if (serverPlayers[id].x >= 1000 / 20) {
      serverPlayers[id].x = -1
    } else if (serverPlayers[id].x < 0) {
      serverPlayers[id].x = 1000 / 20
    } else if (serverPlayers[id].y >= 600 / 20) {
      serverPlayers[id].y = -1
    } else if (serverPlayers[id].y < 0) {
      serverPlayers[id].y = 600 / 20
    }
  }
  
  
  io.emit('updateClientPlayers', serverPlayers, serverFood);
}, 100)

httpServer.listen(3000);

