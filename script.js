"use strict";

/* 
events - a super-basic Javascript (publish subscribe) pattern
Events module by learncode.academy, edited
github: https://gist.github.com/learncodeacademy/777349747d8382bfb722
youtube: https://www.youtube.com/watch?v=nQRXi1SVOow&list=PLoYCgNOIyGABs-wDaaxChu82q_xQgUb4f&index=4
*/
const events = (function () {
    const events = {};

    function on(eventName, fn) {
      events[eventName] = events[eventName] || [];
      events[eventName].push(fn);
    };

    function off(eventName, fn) {
      if (events[eventName]) {
        for (let fun of events[eventName]) {
          if (fun === fn) {
            events[eventName].pop(fun);
            break;
          }
        };
      }
    };

    function emit(eventName, data) {
      if (events[eventName]) {
        events[eventName].forEach(function(fn) {
          fn(data);
        });
      }
    }

    return({on, off, emit});
})();

(function () {

    events.on("formSubmit", createPlayers);

    const playerFactory = (function () {
        const player = (name, mark) => {return {name, mark}};
        return {player}
    })();
    
    function createPlayers({player1Name, player2Name}) {

        // Create players
        const player1 = playerFactory.player(player1Name, "X");
        const player2 = playerFactory.player(player2Name, "O");

        // send players
        events.emit("playersCreated", {player1, player2});
    }
    
})();

(function displayController() {
   
    const domElmts = {};

    // On game initialization add form listener
    events.on("initGame", cacheDom);
    events.on("initGame", addFormListener);


    // On game start remove form listener, add btn listeners
    events.on("gameStarted", removeFormListener);
    events.on("gameStarted", addBtnListener);

    // On player move registered mark btn content 
    events.on("moveRegistered", markBtn);

    // On game over remove btns listener, addForm listener, declareResult, resetGame
    events.on("gameOver", removeBtnListener);
    events.on("gameOver", declareResult);
    // events.on("gameOver", resetGame);

    function declareResult ({winBtns, player}) {
        if (player && winBtns) {
            alert(`${player.name} has won the game with ${player.moves} moves.`)
            winBtns.forEach(btn => {btn.classList.add("winner")})
            console.log(winBtns)
        }
        else {
            alert("draw")
        }
    }
    function cacheDom() {
    
        // Cache form elmts
        domElmts.playersForm = document.querySelector("form#players");
        domElmts.player1Input = domElmts.playersForm.querySelector("input#player1");
        domElmts.player2Input = domElmts.playersForm.querySelector("input#player2");

        // Cahe move-btn elmts
        document.querySelectorAll(".btn-move").forEach(btn => {
            domElmts.btns = domElmts.btns || [];
            domElmts.btns.push(btn);
        });
    }

    // Form functions
    function addFormListener () {
        domElmts.playersForm.addEventListener("submit", triggerFormSubmit);
    }
    function removeFormListener () {
        domElmts.playersForm.removeEventListener("submit", triggerFormSubmit);
    }
    function triggerFormSubmit (e) {
        e.preventDefault();
        events.emit("formSubmit", {player1Name: domElmts.player1Input.value, player2Name: domElmts.player2Input.value});
    }

    // Btn functions
    function addBtnListener() {
        domElmts.btns.forEach(btn => {
            btn.addEventListener("click", triggerBtnClick);
        });        
    }
    function removeBtnListener() {
        domElmts.btns.forEach(btn => {
            btn.removeEventListener("click", triggerBtnClick);
        });   
    }
    function triggerBtnClick(e) {
        e.preventDefault();
        events.emit("btnClick", this);
    }

    // Display player MARK
    function markBtn({btn, player}) {
        btn.textContent = player.mark;  
    }
})();

const gameFlowController = (function () {
    
    const gameData = {};

    events.on("playersCreated", registerPlayers);
    events.on("btnClick", registerMove);
    
    function initGame() {
        events.emit("initGame");
    }
    function registerPlayers({player1, player2}) {
        console.log(player1,player2)

        gameData.player1 = player1;
        gameData.player2 = player2;
        gameData.currentPlayer = player1;
        events.emit("gameStarted");
    }
    function registerMove(btn) {
        if (!btn.dataset.mark) {
            events.emit("moveRegistered", {btn, player: gameData.currentPlayer});
            cachePosition(btn);
            checkWinner(btn);
        }    
    }
    function cachePosition(btn) {
        gameData.currentPlayer[btn.id] = btn;
        gameData.currentPlayer.moves = gameData.currentPlayer?.moves ? ++gameData.currentPlayer.moves : 1;
    }
    function checkWinner(btn) {
        
        const [row, col] = btn.id.split("-").map(coordinateVal => parseInt(coordinateVal.at(-1)));
        
        for (let result of checkResult(row, col)) { 
            if (result.filter(btn => btn !== undefined).length === 3 ) {
                events.emit("gameOver", {winBtns: result, player: gameData.currentPlayer});
                return;
            }
        }

        if (gameData.player1.moves + gameData.player2.moves === 9) {
            events.emit("gameOver", {});
        }
        else {
            changePlayerTurn();
        }
    }
    function checkResult(row, col) {
        
        let vertical = [], 
            horizontal = [],
            diagLeft = [], 
            diagRight =[];

        for (let i = 1; i < 4; i++) {
            // Check vertical
            vertical.push(check(i, col)); 

            // Check horizontal
            horizontal.push(check(row, i)); 

            // If middle point, check both diagonals
            if (row === col && row === 2) {

                // Check top-left to bottom-right diagonal
                diagLeft.push(check(i, i));
                
                // Check top-right to bottom-left diagonal
                diagRight.push(check(i, 4-i));
            }
            // 
            else if (row === col) {

                // Check top-left to bottom-right diagonal
                diagLeft.push(check(i, i));
            }
            else if (Math.abs(row-col) === 2) {

                // Check top-right to bottom-left diagonal
                diagRight.push(check(i, 4-i));                
            }
        }
        return [vertical, horizontal, diagLeft, diagRight];
    }
    function check (row, col) {
        return gameData.currentPlayer[`row${row}-col${col}`];
    }
    function changePlayerTurn(){
        gameData.currentPlayer = gameData.currentPlayer === gameData.player1 ? 
                gameData.player2 : gameData.player1;
    }

    return {initGame}
})();

window.addEventListener("DOMContentLoaded", () => {
    gameFlowController.initGame();
});