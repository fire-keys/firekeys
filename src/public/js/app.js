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

const socket = io();

const userNameForm = $('#name-form');
const UserNameInput = $('#name');
let userName;
let userData;
// for statistice
let startTime = new Date();
let numberOfLettersTyped = 0;
let errors = 0;
let maxWmp = 0;

// get the text to be type
let pText;

$('#section-name-form').show();
$('#section-race').hide();

$('#join-new-race').on('click', () => {
  socket.emit('join-race', { name: userName });
});

userNameForm.on('submit', (event) => {
  event.preventDefault();
  userName = UserNameInput.val();
  socket.emit('join-race', { name: userName });
  UserNameInput.value = '';
});

socket.on('joined', (data) => {
  pText = data.paragraph;
  maxWmp = 0;
  renderParagraphText(data.paragraph);
  $('#typing-text').val('');
  $('#typing-text').attr('maxlength', pText.length);
  $('#typing-text').attr('disabled', 'disabled');
  $('#section-name-form').hide();
  $('#section-race').show();
});

socket.on('waiting', (payload) => {
  $('#waiting').text('Waiting the race to start');
});

socket.on('race-data', renderData);

function renderData(payload) {
  $('#race-details').empty();
  payload.users.forEach((user) => {
    $('#race-details').append(`
    <div class="user-data">
      <div class="user-name"> ${user.name}${
      user.id === socket.id ? '(You)' : ''
    }</div>
      <div class="wmp"> ${user.wpm || 0} WPM</div>
      <div class="max-wmp"> Max WPM: ${user.maxWmp || 0}</div>
      <div class="errors"> ${user.errors || 0} Errors</div>
      <div class="progress"> progress ${
        Math.floor(user.progress * 100) || 0
      }%</div> 
    </div>
    `);
  });
}

socket.on('started', (payload) => {
  // render a timer for five second
  let timer = 5;
  const timeOut = setInterval(() => {
    $('#waiting').text(timer);
    timer--;
    if (timer === -1) {
      $('#waiting').text('Go');
      $('#typing-text').removeAttr('disabled').focus();
      clearInterval(timeOut);
    }
  }, 1000);
  $('#waiting').text('');
  renderData(payload);
});

socket.on('race-finished', (payload) => {
  //wen the race finish
  // View the final result and join new race button
  console.log('race finished');
  window.alert('The race was finished');
});

//{name: "wesam", wpm: 35, progress: 0.95, errors: 4, complete: false}

const typingText = $('#typing-text').on('input', function (event) {
  event.preventDefault();
  numberOfLettersTyped++;

  const inputText = event.target.value.split('');
  let wpm = wordPerMinute(startTime);
  let progress = getProgress(inputText, pText);

  if (numberOfLettersTyped === 15 || progress === 1) {
    // five word in average
    userData = {
      name: userName,
      wpm: wpm,
      maxWmp: maxWmp,
      errors: errors,
      progress: progress,
    };

    socket.emit('refresh-data', userData);

    $('#wmp-text').text(wpm);
    startTime = new Date();
    numberOfLettersTyped = 0;
  }

  errors = 0;

  $('.paragraph-text span').each(function (index) {
    const character = inputText[index];

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

function getProgress(inputText, paragraphText) {
  return (inputText.length - errors) / paragraphText.split('').length;
}

// get the paragraph text element
function renderParagraphText(pText) {
  const paragraphText = $('div.paragraph-text');
  paragraphText.empty();
  pText.split('').forEach((character) => {
    paragraphText.append($(`<span>${character}</span>`));
  });
}
