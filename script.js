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
        let playerTag = 0;
        const player = (name, mark) => {return {name, mark, playerId: ++playerTag}};
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

(function () {
   
    const domElmts = {};

    // On game start remove btn listeners
    events.on("newGame", addBtnMoveListener);
    events.on("newGame", addBtnRestartListener);

    // On playermoveregistered mark btn content 
    events.on("moveRegistered", markbtnMove);

    // On game over removebtnMovelistener, declareResult, removebtnRestartlistener, resetBtnMove
    events.on("gameOver", resetGame);
    events.on("gameOver", declareResult);

    window.addEventListener("DOMContentLoaded", () => {
        cacheDom();
        addFormListener();
        // displayHistory();
    });

    // Cache DOM
    function cacheDom() {
    
        // Cache form elmts
        domElmts.playersForm = document.querySelector("form#players");
        domElmts.player1Input = domElmts.playersForm.querySelector("input#player1");
        domElmts.player2Input = domElmts.playersForm.querySelector("input#player2");
        domElmts.btnRestart = domElmts.playersForm.querySelector("button[type='button']");

        // Cahe move-btn elmts
        document.querySelectorAll(".btn-move").forEach(btn => {
            domElmts.btnMove = domElmts.btnMove || [];
            domElmts.btnMove.push(btn);
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

    // btnMove functions
    function addBtnMoveListener() {
        domElmts.btnMove.forEach(btn => {
            btn.addEventListener("click", triggerBtnMoveClick);
        });        
    }
    function removeBtnMoveListener() {
        domElmts.btnMove.forEach(btn => {
            btn.removeEventListener("click", triggerBtnMoveClick);
        });   
    }
    function triggerBtnMoveClick(e) {
        e.preventDefault();
        events.emit("btnMoveClick", this);
    }

    // btnMove specials
    function markbtnMove({btn:btnMove, player}) {
        btnMove.textContent = player.mark;
    }
    function resetBtnMove() {
        setTimeout( () => {
            domElmts.btnMove.forEach(btn => {
                btn.classList.remove("winner");
                btn.textContent = "";
                events.emit("newGame")
            });     
        }, 500);
    }

    // BtnRestart functions
    function addBtnRestartListener() {
        domElmts.btnRestart.addEventListener("click", triggerBtnRestartClick);
    }
    function removeBtnRestartListener() {
        domElmts.btnRestart.removeEventListener("click", triggerBtnRestartClick);
    }
    function triggerBtnRestartClick(e) {
        e.preventDefault();
        events.emit("btnRestartClick");
        resetGame();
    }
    function resetGame() {
        removeBtnRestartListener();       
        removeBtnMoveListener();
        resetBtnMove();
    }

    // Display result
    function declareResult ({resultBtns, player}) {
        console.log(resultBtns, player)
        if (player && resultBtns) {
            resultBtns.forEach(btn => {btn.classList.add("winner")})
            setTimeout(() => {
                alert(`${player.name} has won the game with ${player.moves} moves.`);
            }, 300);
        }
        else {
            setTimeout(() => {
                alert("draw");
            }, 300);
        }
    }
    
})();

const gameFlowController = (function () {
    
    const gameData = {};

    events.on("playersCreated", registerPlayers);
    events.on("btnMoveClick", registerMove);
    events.on("btnRestartClick", resetGame);
    events.on("newGame", resetGame);
    
    function initGame() {
        
    }
    function registerPlayers({player1, player2}) {
        gameData.player1 = player1;
        gameData.player2 = player2;
        gameData.currentPlayer = player1;
        events.emit("newGame");
    }
    function registerMove(btn) {
        if (!btn.dataset.mark) {
            events.emit("moveRegistered", {btn, player: gameData.currentPlayer});
            updatePositions(btn);
            updatePlayerMoves(1);
            checkWinner(btn);
        }    
    }
    function updatePlayerMoves(by) {
        if (by) {
            gameData.currentPlayer.moves = gameData.currentPlayer?.moves || 0;
            gameData.currentPlayer.moves += by;
        }
        else {
            delete gameData?.player1?.moves; 
            delete gameData?.player2?.moves;        
        }
    }
    function updatePositions(btn) {
        if (btn) {
            gameData.currentPlayer.positions = gameData.currentPlayer.positions || {};
            gameData.currentPlayer.positions[btn.id] = btn;
        }
        else {
            delete gameData?.player1?.positions; 
            delete gameData?.player2?.positions;
        }
    }
    function checkWinner(btn) {
        
        const [row, col] = btn.id.split("-").map(coordinateVal => parseInt(coordinateVal.at(-1)));

        for (let resultBtns of checkResult(row, col)) { 
            if (resultBtns.filter(btn => btn !== undefined).length === 3 ) {
                events.emit("gameOver", {resultBtns, player: gameData.currentPlayer});
                saveHistory(resultBtns);
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
        return gameData.currentPlayer.positions[`row${row}-col${col}`];
    }
    function changePlayerTurn(){
        gameData.currentPlayer = gameData.currentPlayer === gameData.player1 ? 
                gameData.player2 : gameData.player1;
    }
    function saveHistory(winBtns){
    let identifier = gameData.currentPlayer.name + "-" + gameData.currentPlayer.playerId;
       gameData.history = gameData.history || {};
       gameData.history[identifier] = gameData.history[identifier] || [];
       gameData.history[identifier].push([gameData.currentPlayer.moves, winBtns]);
       console.log(gameData.history)
    }
    function resetGame() {
        updatePositions();
        updatePlayerMoves();
    }

    return {initGame}
})();



//add computer player
// add option to let players turn announcement using name
// add difficulty level for computer player
// css