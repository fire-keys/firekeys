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

let races = []; // [{raceId: "2e3s-1s5f4-d2dd-3pc3", started: true,  finished: false , users: [{name: "wesam", wpm: 35, progress: 0.95, errors: 4, complete: false, timestamp: 54545487841}, ...]}, ...]


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
    let raceId=null;
    for (let roomID of socket.rooms) {
      if (roomID !== socket.id) {
        raceId=roomID   
      }
   const userIndex= races[raceIndex].users.findIndex(user=>user.id=socket.id)
    races[raceId].users[userIndex] =  {...races[raceId].users[userIndex] , wpm: payload.wpm, progress: payload.progress, errors: payload.progress, complete: payload.progress };

    socket.emit('updated', races[raceId]);
  
  };

  // on disconnect
  socket.on('disconnect', (payload) => 
  {
    let raceId=null;
    if (socket.rooms.size > 1) {
      for (let roomID of socket.rooms) {
        if (roomID !== socket.id) {
          raceId=roomID;

        }
      }
    }
   
    const removeUser = (id,raceId) => {
      const raceIndex = races.findIndex(race =>  race.raceId === raceId);
      if (raceIndex !== -1) {
      //splice method returns the removed the race
        const userIndex= races[raceIndex].users.findIndex(user=>user.id=id);
        delete races[raceIndex].users[userIndex];
      }
    };
    removeUser(socket.id,raceId);


    // The user disconnected for some reason
    // Get a race id from the socket if the user in a race then remove the user from that race (from the race array)
  });
});


// [{raceId: "2e3s-1s5f4-d2dd-3pc3", started: true,  finished: false , users: [{name: "wesam", wpm: 35, progress: 0.95, errors: 4, complete: false, timestamp: 54545487841}, ...]}, ...]

// every half second do this

setInterval(() => {


  races.forEach((race, index) => {
    if (!race.started){
      if (race.users.length > 1)
      {
        races[index]={...races[index], started: true };
        // copy of races
        // update property started in it
        // spreading 
        io.to(race.raceId).emit('race-started',  race  );
      } else if (race.users.length===1){
        io.to(race.raceId).emit('waiting');}
      else {
        io.to(race.raceId).emit('waiting');
        delete races[index];}

    } else if (race.started && race.finished){
      io.to(race.raceId).emit('race-finished',  race );
      delete races[index];

    } else if (race.started && !race.finished){
      io.to(race.raceId).emit('race-data', race);
    } 
  });
  
  // if the race not started yet, then check if the users more than one then start then change the state of the race to started then emit race-data to all users in that race with all race data(
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
