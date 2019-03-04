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
let gameOn = false;
let totalShots = 0;
let totalHits = 0;
let bonkPosition;
const results = JSON.parse(localStorage.getItem('results')) || [{
    player: 'Aco',
    result: 40,
    id: 0,
    precision: 95
}, {
    player: 'Luka',
    result: 39,
    id: 1,
    precision: 93
}, {
    player: 'Boki',
    result: 45,
    id: 2,
    precision: 100
}];
let playerName = (results.length > 0) ? results[results.length - 1].player : 'Player One';
const newPlayerForm = {
    text: document.querySelector('.playerName'),
    button: document.querySelector('.submitBtn')
};
const moles = document.querySelectorAll('.mole');
let lastHole;
let timeUp = false;
let gameTimer;

newPlayerForm.text.value = playerName;

function Timer(callback, finalCallback, time) {
    this.setInterval(time);
    this.callback = callback;
    this.finalCallback = finalCallback;
    this.timeAdded = 0;
}

Timer.prototype.setInterval = function(time) {
    var self = this;
    this.finished = false;
    this.time = time;
    this.timeFormated = time / 1000;
    this.start = Date.now();
    this.currentTime = 0;

    this.interval = setInterval(function() {
        self.currentTime = (Date.now() - self.start) - (Date.now() - self.start) % 1000;
        document.querySelector('.timeLeft').classList.remove('extra');
        if ( self.currentTime == time ) {
            self.timeFormated--;
            self.finished = true;
            clearInterval(self.interval);
            self.finalCallback(self.timeFormated);
        }  else {
            if ( self.timeAdded > 0 ) {
                time = self.time - self.currentTime + self.timeAdded;
                clearInterval(self.interval);
                self.setInterval(time);
                self.callback(time / 1000);
                self.timeAdded = 0;
                return;
            }
            self.timeFormated--;
            self.callback(self.timeFormated);
        }
    }, 1000);
};

Timer.prototype.add = function(time) {
    if (!this.finished) {
        this.timeAdded = time;
        document.querySelector('.timeLeft').classList.add('extra');
        document.querySelector('.timeLeft').dataset.addedSeconds = time / 1000;
    }
};

function injectTime(time) {
    const timeLeft = document.querySelector('.timeLeft');
    timeLeft.innerText = time;
}

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
        id: results.length,
        precision: Math.round(totalHits / totalShots * 100)
    };

    console.log({totalShots, totalHits});

    const currentId = result.id;
    results.push(result);

    const loserText = `Sorry <strong>${result.player}</strong>, you are not in top 10 :(`;
    const winnerText = `Congratulations <strong>${result.player}</strong>, you are in top 10!`;

    const sorted = results.sort((a, b) => {
        if (a.result < b.result) return 1;
        if (a.result > b.result) return -1;

        if ( a.precision < b.precision ) return 1;
        if ( a.precision > b.precision ) return -1;

        if ( a.player < b.player ) return -1;
        if ( a.player > b.player ) return 1;
    });

    const minimized = sorted.filter((result,i) => ( i < 10 ) ? true : false);
    const tableContent = minimized.map((result, index) => {
        return `
        <div class="table__row ${currentId == result.id ? 'active' : ''}">
            <div class="table__cell">${index + 1}</div>
            <div class="table__cell">${result.player}</div>
            <div class="table__cell u-pr-20">${result.precision}%</div>
            <div class="table__cell"><strong>${result.result}</strong></div>
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

    totalShots = 0;
    totalHits = 0;
}

function startGame() {
    document.querySelectorAll('audio').forEach(audio => audio.pause());
    popupOverlay.classList.add('faded');
    scoreBoard.className = 'score';
    bonus();
    setTimeout(() => {
        popupOverlay.classList.add('hidden');
        gameOn = true;
    }, 300);
    scoreBoard.textContent = 0;
    timeUp = false;
    score = 0;
    peep();

    gameTimer = new Timer(injectTime, function(time){
        timeUp = true;
        popupOverlay.classList.remove('hidden');
        table.classList.add('show');
        setTimeout(() => {
            popupOverlay.classList.remove('faded');
            setTimeout(() => {
                table.classList.add('fade');
            }, 500);
        }, 300);
        injectTime(time);
        updateResults();
        // Stopping the combo sound
        comboSound.pause();
        comboSound.currentTime = 0;
        gameOn = false;
    }, gameDuration);

}

function comboCounter(e) {
    const moleCheck = e.target.classList.contains('mole');
    const bonusMoleCheck = e.target.classList.contains('bonusMole');

    if ( gameOn ) totalShots++;
    if ( moleCheck || bonusMoleCheck ) {
        combo++;
        totalHits++;
        // Playing the combo sound
        if ( combo == 4 ) comboSound.play();
    } else {
        combo = 0;
        scoreBoard.className = 'score';
        // Stopping the combo sound
        comboSound.pause();
        comboSound.currentTime = 0;
        if ( gameOn ) addBulletHole(e);
    }

    document.querySelector('.combo__bar').className = `combo__bar combo__bar--${ combo < 7 ? combo : '6' }`;
}

function addBulletHole(e) {
    const clickPosition = {
        left: e.pageX,
        top: e.pageY
    };

    const bulletHole = document.createElement('div');
    bulletHole.classList.add('bulletHole');
    document.body.appendChild(bulletHole);

    bulletHole.classList.add('show');
    bulletHole.style.left = clickPosition.left + 'px';
    bulletHole.style.top = clickPosition.top + 'px';

    setTimeout(() => {
        bulletHole.classList.remove('show');
        setTimeout(() => {
            bulletHole.remove();
        }, 300);
    }, 500);
}

function bloodEffect(e) {
    bonkPosition = {
        top: e.pageY,
        left: e.pageX
    };

    blood.style.top = bonkPosition.top + 'px';
    blood.style.left = bonkPosition.left + 'px';
    blood.classList.add('show');

    setTimeout(() => {
        blood.classList.remove('show');
    }, 500);
}

function bonk(e) {
    if ( timeUp ) return;
    if ( !e.isTrusted ) return; // checking if it's a real click

    this.classList.add('bonked');
    clapSound.currentTime = 0;
    bonkSound.currentTime = 0;
    bonkSound.play();

    bloodEffect(e);

    setTimeout(() => {
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
        gameTimer.add(1000);
    }

    this.parentNode.classList.remove('up');
    scoreBoard.textContent = score;
}

moles.forEach(mole => mole.addEventListener('click', bonk));
bonusMole.addEventListener('click', function(e) {
    if ( timeUp ) return;
    this.classList.remove('bonusMole--peek');
    this.classList.add('bonusMole--dead');
    score += 3;
    scoreBoard.textContent = score;
    scoreBoard.classList.add('bonus');
    bonkSound.currentTime = 0;
    clapSound.currentTime = 0;
    clapSound.play();
    bloodEffect(e);

    this.classList.add('bonked');
});

newPlayerForm.button.addEventListener('click', (e) => {
    playerName = document.querySelector('.playerName').value || 'Player One';
    startGame();
    e.preventDefault();
});

document.body.addEventListener('click', comboCounter);
