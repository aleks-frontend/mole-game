/* eslint-disable no-console */
const blood = document.querySelector('.blood');
const holes = document.querySelectorAll('.hole');
const bonusMole = document.querySelector('.bonusMole');
const scoreBoard = document.querySelector('.score');
const endMessageDiv = document.querySelector('.endMessage');
const popupOverlay = document.querySelector('.popup__overlay');
const table = document.querySelector('.table');
const bonkSound = document.querySelector('.bonkSound');
const clapSound = document.querySelector('.clapSound');
const applauseSound = document.querySelector('.applauseSound');
const booSound = document.querySelector('.booSound');
const comboSound = document.querySelector('.comboSound');
let gameDuration = 15000;
let score;
let endMessage = '';
let combo = 0;
const results = JSON.parse(localStorage.getItem('results')) || [];
let playerName = (results.length > 0) ? results[results.length - 1].player : 'Player One';
const newPlayerForm = {
    text: document.querySelector('.playerName'),
    button: document.querySelector('.submitBtn')
};
const moles = document.querySelectorAll('.mole');
let lastHole;
let timeUp = false;

newPlayerForm.text.value = playerName;

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    const idx = Math.floor(Math.random() * holes.length);
    const hole = holes[idx];

    if ( lastHole === hole ) {
        return randomHole(holes);
    }

    lastHole = hole;
    return hole;
}

function bonus() {
    const lucky = (Math.random() > 0.5);
    bonusMole.className = 'bonusMole';
    if  ( !lucky ) return;

    const start = Math.floor(Math.random() * gameDuration);

    const positions = {
        sides: [ 'top', 'right', 'bottom', 'left' ],
        aligns: ['start', 'middle', 'end']
    };

    const position = {
        side: positions.sides[Math.round(Math.random() * 3)],
        align: positions.aligns[Math.round(Math.random() * 2)]
    };

    bonusMole.classList.add(`bonusMole--${position.side}`, position.align);
    setTimeout(() => {
        bonusMole.classList.add('bonusMole--peek');
        setTimeout(() => {
            bonusMole.classList.remove('bonusMole--peek');
        }, randomTime(800, 1500));
    }, start);
}

function peep() {
    const hole = randomHole(holes);
    const time = randomTime(500, 2000);

    hole.classList.add('up');
    hole.querySelector('.mole').classList.remove('bonked');
    setTimeout(() => {
        hole.classList.remove('up');
        if ( !timeUp ) {
            peep();
        }
    }, time);
}

function updateResults() {
    applauseSound.currentTime = 0;
    const result = {
        player: playerName,
        result: parseInt(scoreBoard.innerText),
        id: results.length
    };

    const currentId = result.id;
    results.push(result);

    const loserText = `Sorry <strong>${result.player}</strong>, you are not in top 10 :(`;
    const winnerText = `Congratulations <strong>${result.player}</strong>, you are in top 10!`;

    const sorted = results.sort((a, b) => (a.result < b.result) ? 1 : -1);
    const minimized = sorted.filter((result,i) => ( i < 10 ) ? true : false);
    const tableContent = minimized.map((result, index) => {
        return `
        <div class="table__row ${currentId == result.id ? 'active' : ''}">
            <div class="table__cell">${index + 1}</div>
            <div class="table__cell">${result.player}</div>
            <div class="table__cell">${result.result}</div>
        </div><!-- end table__row -->
        `;
    }).join('');
    document.querySelector('.table').innerHTML = tableContent;
    localStorage.setItem('results', JSON.stringify(results));

    const top10 = minimized.some(mini => mini.id == currentId );

    top10 ? applauseSound.play() : booSound.play();

    endMessage = top10 ? winnerText: loserText;
    if ( minimized[0].id == currentId ) endMessage = `Fuck yeah! You are the best ${result.player}!!!`;
    endMessageDiv.innerHTML = endMessage;
}

function startGame() {
    document.querySelectorAll('audio').forEach(audio => audio.pause());
    popupOverlay.classList.add('faded');
    scoreBoard.className = 'score';
    bonus();
    setTimeout(() => {
        popupOverlay.classList.add('hidden');
    }, 300);
    scoreBoard.textContent = 0;
    timeUp = false;
    score = 0;
    peep();
    setTimeout(() => {
        timeUp = true;
        popupOverlay.classList.remove('hidden');
        table.classList.add('show');
        setTimeout(() => {
            popupOverlay.classList.remove('faded');
            setTimeout(() => {
                table.classList.add('fade');
            }, 500);
        }, 300);
        updateResults();
        // Stopping the combo sound
        comboSound.pause();
        comboSound.currentTime = 0;
    }, gameDuration);
}

function comboCounter(e) {
    const moleCheck = e.target.classList.contains('mole');
    const bonusMoleCheck = e.target.classList.contains('bonusMole');

    if ( moleCheck || bonusMoleCheck ) {
        combo++;
        // Playing the combo sound
        if ( combo == 4 ) comboSound.play();
    } else {
        combo = 0;
        scoreBoard.className = 'score';
        // Stopping the combo sound
        comboSound.pause();
        comboSound.currentTime = 0;
    }

    document.querySelector('.combo__bar').className = `combo__bar combo__bar--${ combo < 7 ? combo : '6' }`;
}

function bonk(e) {
    if ( timeUp ) return;
    if ( !e.isTrusted ) return; // checking if it's a real click
    // if ( !this.parentNode.classList.contains('up') ) return; // checking for a double click

    const bonkPosition = {
        top: e.pageY,
        left: e.pageX
    };

    blood.style.top = bonkPosition.top + 'px';
    blood.style.left = bonkPosition.left + 'px';
    blood.classList.add('show');

    this.classList.add('bonked');
    clapSound.currentTime = 0;
    bonkSound.currentTime = 0;
    bonkSound.play();

    setTimeout(() => {
        blood.classList.remove('show');
        this.classList.remove('bonked');
    }, 500);

    if ( combo < 3 ) {
        score++;
        scoreBoard.className = 'score';
    } else if ( combo >= 3 && combo < 6 ) {
        score = score + 2;
        scoreBoard.classList.add('combo1');
    } else {
        score = score + 3;
        scoreBoard.classList.remove('combo1');
        scoreBoard.classList.add('combo2');
    }

    this.parentNode.classList.remove('up');
    scoreBoard.textContent = score;
}

moles.forEach(mole => mole.addEventListener('click', bonk));
bonusMole.addEventListener('click', function() {
    if ( timeUp ) return;
    this.classList.remove('bonusMole--peek');
    this.classList.add('bonusMole--dead');
    score += 3;
    scoreBoard.textContent = score;
    scoreBoard.classList.add('bonus');
    bonkSound.currentTime = 0;
    clapSound.currentTime = 0;
    clapSound.play();
});
newPlayerForm.button.addEventListener('click', (e) => {
    playerName = document.querySelector('.playerName').value || 'Player One';
    startGame();
    e.preventDefault();
});

document.body.addEventListener('click', comboCounter);