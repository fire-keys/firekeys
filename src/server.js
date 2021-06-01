'use strict';

// Third party packages
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketServer = require('socket.io');

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

/* All socket logic */
io.on('connection', (socket) => {
  console.log('a user Connected :', socket.id);

  // on join race
  socket.on('join-race', (payload) => {
    // client send object {name: "wesam"}
    // get a race id from the socket if the user were already in arace then remove the user from the race (race array)
    // check races if emty create a random race id and add it to races then make the user join this race room
    // if races was not empty then check the last race if has less than 5 users and not started yet then make the user join the race
    // else create a new race as if races was empty
    // emit joined event to the user
  });

  // on receive data
  socket.on('refresh-data', (payload) => {
    //client send all information about his progress {name: "wesam", wpm: 35, progress: 0.95, errors: 4, complete: false}
    // get the race id from the socket then update the user data in races array
  });

  // on disconnect
  socket.on('disconnect', () => {
    // The user disconnected for some reason
    // Get a race id from the socket if the user in a race then remove the user from that race (from the race array)
    console.log('user disconnected: ', socket.id);
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
