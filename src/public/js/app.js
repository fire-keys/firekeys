'use strict';

// disable copy, past, cut text
$('body').bind('cut copy paste', function (e) {
  e.preventDefault();
});
// disable mouse right click
$('body').on('contextmenu', function (e) {
  return false;
});

// disable drop in to text input
$('#typing-text').on('mouseup', function (e) {
  e.preventDefault ? e.preventDefault() : (e.returnValue = false);
});

// create client socket
const socket = io();

// References to important elements 
const startPageSection = $('#main-section');
const racePageSection = $('#section-race');
const userNameForm = $('#name-form');
const userNameInput = $('#name');
const joinNewRaceBtn = $('#join-new-race');
const inputTextEl = $('#typing-text');
const paragraphText = $('div.paragraph-text');
const raceDetailsEl = $('#race-details');
const waitingEle = $('#waiting');
const activeRacesEl = $('#races-area');

// global variables
let userName;
let userData;
let startTime = new Date();
let numberOfLettersTyped = 0;
let errors = 0;
let maxWmp = 0;
// get the text to be type
let pText;
let spectateMode = false;

// Inital show the start form
startPageSection.show();
// racePageSection.hide();

// whent user want to join a race
joinNewRaceBtn.on('click', () => {
  socket.emit('join-race', { name: userName });
});

userNameForm.on('submit', (event) => {
  event.preventDefault();
  userName = userNameInput.val().slice(0, 6);
  socket.emit('join-race', { name: userName });
  userNameInput.value = '';
});

// Requesting races data
socket.emit('get-races');
// receivign the races data
socket.on('list-races', (data) => {

  // render races list
  renderRacesList(data);
  // after rendering the elements, add event listenere to emit the join-spectator mode
  $('button.view').on('click', (e) => spectateRace(e.target.id));
});


// On joining spectate mode
socket.on('spectate-joined', (data) => {
  spectateMode = true;
  pText = data.paragraph;
  renderParagraphText(data.paragraph);
  inputTextEl.hide();
  startPageSection.hide();
  racePageSection.css({'display': 'flex'});
});

// whent the server successfully joined the user to a race
socket.on('joined', (data) => {
  pText = data.paragraph;
  maxWmp = 0;
  renderParagraphText(data.paragraph);
  inputTextEl.val('');
  inputTextEl.attr('maxlength', pText.length);
  inputTextEl.attr('disabled', 'disabled');
  startPageSection.hide();
  racePageSection.css({'display': 'flex'});
});

// Joind a race and waiting for other users
socket.on('waiting', (payload) => {
  waitingEle.text('Waiting other users');
});

// Get updates from the server
socket.on('race-data', renderData);

// when the race started
socket.on('started', (payload) => {
  // render a timer for five second
  let timer = 5;
  const timeOut = setInterval(() => {
    waitingEle.text(timer);
    waitingEle.css({
      'font-size': '35px',
    });
    timer--;
    if (timer === -1) {
      waitingEle.text('Go');
      inputTextEl.removeAttr('disabled').focus();
      clearInterval(timeOut);
      setTimeout(() => {
        $('.waiting-container').hide();
      }, 500);
    }
  }, 1000);
  waitingEle.text('');
  renderData(payload);
});

// when the race finish
socket.on('race-finished', (payload) => {
  //wen the race finish
  // View the final result and join new race button
  console.log('race finished');
  // if it were in spectate mode let the user back to home page(hide the race section and show the form name section)
  window.alert('The race was finished');
});

// on typing through the race
inputTextEl.on('input', function (event) {
  event.preventDefault();
  numberOfLettersTyped++;

  // reset the error counter to calculate again
  errors = 0;

  const inputText = event.target.value.split('');
  
  $('div.paragraph-text span').each(function (index) {
    const character = inputText[index];
    // colorize the correct/mistake characters
    if (!character) {
      $(this).removeClass('error');
      $(this).removeClass('correct');
    } else if (character === $(this).text()) {
      $(this).addClass('correct');
      $(this).removeClass('error');
    } else if (character !== $(this).text()) {
      errors++;
      $(this).addClass('error');
      $(this).removeClass('correct');
    }
  });

  let wpm = wordPerMinute(startTime);
  let progress = getProgress(inputText, pText);

  if (numberOfLettersTyped === 10 || progress === 1) {
    // two word in average
    userData = {
      name: userName,
      wpm: wpm,
      maxWmp: maxWmp,
      errors: errors,
      progress: progress,
    };
    // send data to the server
    socket.emit('refresh-data', userData);

    // reset the time and letters typed to compute the speed of typing for next time
    startTime = new Date();
    numberOfLettersTyped = 0;
  }

});

// Asuuming that each word consist of five letter in average
function wordPerMinute(startTime) {
  const timeDiff = (new Date() - startTime) / (1000 * 60);
  const wpm = Math.floor(numberOfLettersTyped / 5 / timeDiff);
  if (wpm > maxWmp) {
    maxWmp = wpm;
  }
  return wpm;
}

// calculate the progress of the player
function getProgress(inputText, paragraphText) {
  return (inputText.length - errors) / paragraphText.split('').length;
}

// get the paragraph text element
function renderParagraphText(pText) {
  paragraphText.empty();
  pText.split('').forEach((character) => {
    paragraphText.append($(`<span>${character}</span>`));
  });
}

// render the updated data
function renderData(payload) {
  $('#spect-count').text(payload.spectators.length);
  raceDetailsEl.empty();
  payload.users.forEach((user, index) => {
    raceDetailsEl.append(`
    <div class="user">
    <div class="character-and-ground">
      <div class="username-char">
        <p>${user.name}</p>
        <div class="character-path">
          <div style="left:${Math.floor(user.progress * 100) || 0}%;" class="character">
            <span>${user.id === socket.id ? 'Me' : ''}</span>
            <img class="character" src="/img/dino-${index + 1 || 1}.gif" />
          </div>
        </div>
      </div>
      <div class="race-ground"></div>
    </div>

    <img class="door" src="/img/door.png" />
    <div class="results">
      <div class="mistakes-and-speed">
        <div>
          <img src="/img/yellow.png" />
          <p>Mistakes ${user.errors || 0}</p>
        </div>
        <div>
          <img src="/img/heart.png" />
          <p>Speed ${user.wpm || 0} WPM</p>
        </div>
      </div>
      <div class="pogress">
        <img src="/img/progress.png" />
        <p>Progress ${Math.floor(user.progress * 100) || 0}%</p>
      </div>
    </div>
  </div>
    `);
  });
}

// funtion to render the list of races
function renderRacesList(data) {
  data.races.forEach((race, index) => {
    activeRacesEl.append(`
    <div class='race'>
      <p class='race-info'> Race ${index + 1} </p>
      <button id="${race.raceId}" class="view">
          View
      </button>
    </div>
    `);
  });
}

// function to join a race in spectate mode
function spectateRace(raceId) {
  socket.emit('join-spectate', {raceId: raceId});
}