'use strict';
const socket = io();

const userNameForm = $('#name-form');
const UserNameInput = $('#name');
let userName;
let userData;

// get the text to be type
let pText;

$('#section-name-form').show();
$('#section-race').hide();

$('#join-new-race').on('click', () => {
  socket.emit('join-race', {name: userName});
});

userNameForm.on('submit', event => {
  event.preventDefault();
  userName = UserNameInput.val();
  socket.emit('join-race', { name: userName });
  UserNameInput.value = '';
});

socket.on('joined', data => {
  pText = data.paragraph;
  renderParagraphText(data.paragraph);
  $('#typing-text').attr('maxlength', pText.length);
  $('#section-name-form').hide();
  $('#section-race').show();
});

socket.on('waiting', payload => {
  $('#waiting').text('Waiting the race to start');
})

socket.on('race-data', renderData);


function renderData(payload) {
  console.log(payload)
  $('#race-details').empty();
  payload.users.forEach(user => {
    $('#race-details').append(`
    <div class="user-data">
      <div class="user-name"> ${user.name}${user.id === socket.id ? '(You)' : ''}</div>
      <div class="wmp"> ${user.wpm || 0} WPM</div>
      <div class="errors"> ${user.errors || 0} Errors</div>
      <div class="progress"> progress ${Math.floor(user.progress * 100) || 0}%</div> 
    </div>
    `);
  });


}

socket.on('started', payload => {
  renderData(payload);
});

socket.on('race-finished',payload=>{
  //wen the race finish 
  // View the final result and join new race button
  console.log('race finished');
  window.alert('The race was finished');
});

//{name: "wesam", wpm: 35, progress: 0.95, errors: 4, complete: false}


$('#typing-text').val('');

let startTime = new Date();
let numberOfLettersTyped = 0;
let errors = 0;


const typingText = $('#typing-text').on('input', function (event) {
  event.preventDefault();
  numberOfLettersTyped++;

  const inputText = event.target.value.split('');
  let wpm = wordPerMinute(startTime, pText);
  let progress = getProgress(inputText, pText);

  if (numberOfLettersTyped === 15 || (progress === 1)) {
    // five word in average
    userData = {
      name: userName,
      wpm: wpm,
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
function wordPerMinute(startTime, paragraph) {
  const timeDiff = (new Date() - startTime) / (1000 * 60);
  const wpm = numberOfLettersTyped / 5 / timeDiff;
  return Math.floor(wpm);
}

function getProgress(inputText, paragraphText) {
  return (inputText.length - errors) / paragraphText.split('').length;
}

// get the paragraph text element
function renderParagraphText(pText) {
  console.log(pText)
  const paragraphText = $('div.paragraph-text');

  pText.split('').forEach((character) => {
    paragraphText.append($(`<span>${character}</span>`));
  });
}