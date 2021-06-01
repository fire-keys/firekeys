'use strict';

// Third party packages
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketServer = require('socket.io');
const uuid = require('uuid').v4;

// Internal
const utils = require('./utils');

// Config the server
const app = express();
const httpServer = http.createServer(app);
const io = socketServer(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
io.listen(httpServer);

// Express config
app.use(cors());
app.use(express.static(path.join(__dirname, './public')));

/* Store */

const races = []; // [{raceId: "2e3s-1s5f4-d2dd-3pc3", started: true,  finished: false , users: [{name: "wesam", wpm: 35, progress: 0.95, errors: 4, complete: false, timestamp: 54545487841}, ...]}, ...]


let NUMBER_OF_USERS_PER_RACE = 2;

/* All socket logic */
io.on('connection', (socket) => {
  console.log('a user Connected :', socket.id);

  // on join race
  socket.on('join-race', (payload) => {

    if (races.length === 0 || races[races.length - 1].started === true) {
      let raceId = uuid();
      races.push({
        raceId: raceId,
        started: false,
        finished: false,
        users: [{
          name: payload.name,
          id: socket.id,
        }],
      });
      socket.join(raceId);
      socket.emit('joined', races[races.length - 1]);
    } else {
      if (socket.rooms.size > 1) {
        for (let roomID of socket.rooms) {
          if (roomID !== socket.id) {
            socket.leave(roomID);
          }
        }
      }
      if (races[races.length - 1].started === false && races[races.length - 1].users.length < NUMBER_OF_USERS_PER_RACE) {
        socket.join(races[races.length - 1].raceId);
        races[races.length - 1].started = true;
        races[races.length - 1].users = [...races[races.length - 1].users, { name: payload.name, id: socket.id }];
        socket.emit('joined', races[races.length - 1]);
        io.to(races[races.length - 1].raceId).emit('started', races[races.length - 1]);
      }
    }



  });

  // on receive data
  socket.on('refresh-data', (payload) => {

    // io.sockets.clients(room).forEach(() => {
    //   socket.emit(payload);
    // });



    //client send all information about his progress {name: "wesam", wpm: 35, progress: 0.95, errors: 4, complete: false}
    // get the race id from the socket then update the user data in races array
  });

  // on disconnect
  socket.on('disconnect', (payload) => {


    // The user disconnected for some reason
    // Get a race id from the socket if the user in a race then remove the user from that race (from the race array)
  });
});

// every half second do this
setInterval(() => {
  // loop throug races and on each do the following
  // if the race not started yet, then check if the users more than one then start then change the state of the race to started then emit race-data to all users in that race with all race data
  // if the race started and finished then emit a finish-race to all users in that race then remove the race from the race array
  // if the race not finished yet and the race has only one user then emit waiting event to the race users
  // if the race not finished yet, then emit race-data to all users in that race with all race data
}, 500);

// Function to start the server
const start = (port) => {
  httpServer.listen(port, () => {
    console.log(`The server is running on port ${port}`);
  });
};

module.exports = {
  io: io,
  start: start,
};
