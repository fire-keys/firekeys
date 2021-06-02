'use strict';
const socket = io();

const userNameForm = $('#name-form');
const UserNameInput = $('#name');
let userName;
let userData;

$('#section-name-form').show();
$('#section-race').hide();

userNameForm.on('submit', event => {
  event.preventDefault();
  userName = UserNameInput.val();
  socket.emit('join-race', { name: userName });
  UserNameInput.value = '';

})

socket.on('joined', data => {
  $('#section-name-form').hide();
  $('#section-race').show();


});

socket.on('waiting', payload => {
  $('#waiting').text('Waiting the race to start');
})

socket.on('race-data', renderData)


function renderData(payload) {
  $('#race-details').empty();
  payload.users.forEach(user => {
    $('#race-details').append(`
    <div class="user-data">
    <div class="user-name"> ${user.name}${user.id === socket.id ? '(You)' : ''}</div>
    <div class="wmp"> wpm ${user.wpm || 0}       </div>
    <div class="progress"> progress ${user.progress * 100 || 0}%</div> 
    </div>
    `)
  })


}

socket.on('started', payload => {
  renderData(payload);
});

socket.on('race-finished',payload=>{
  //wen the race finish 
})

//{name: "wesam", wpm: 35, progress: 0.95, errors: 4, complete: false}


$('#typing-text').val('');

let startTime = new Date();
let numberOfLettersTyped = 0;

// get the paragraph text element
const paragraphText = $('div.paragraph-text');

// get the text to be type
const pText =
  'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Delectus reprehenderit natus deserunt sapiente nulla, molestiae nam consequatur vero aut fugit veritatis velit quae, atque facere odit ducimus adipisci repudiandae quam.';

pText.split('').forEach((character) => {
  paragraphText.append($(`<span>${character}</span>`));
});

const typingText = $('#typing-text').on('input', function (event) {
  event.preventDefault();
  numberOfLettersTyped++;

  const inputText = event.target.value.split('');
  $('.paragraph-text span').each(function (index) {
    const character = inputText[index];

    if (numberOfLettersTyped === 15) {
      // five word in average
      let wpm = wordPerMinute(startTime, pText);
      let progress = getProgress(inputText, pText)
      userData = {
        name: userName,
        wpm: wpm,
        progress: progress
      }
      socket.emit('refresh-data', userData)

      $('#wmp-text').text(wpm);
      startTime = new Date();
      numberOfLettersTyped = 0;
    }

    if (!character) {
      $(this).removeClass('error');
      $(this).removeClass('correct');
    } else if (character === $(this).text()) {
      $(this).addClass('correct');
      $(this).removeClass('error');
    } else if (character !== $(this).text()) {
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
  return inputText.length / paragraphText.split('').length;
}