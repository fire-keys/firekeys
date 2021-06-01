'use strict';

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
