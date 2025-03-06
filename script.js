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
        const player = (name, mark, gameMode) => {
            
            return name ? { name, mark, playerId: ++playerTag} : { name: "Computer", mark, playerId: 0, gameMode: gameMode}
        };
        return {player}
    })();
    
    function createPlayers({player1Name, player2Name, gameMode}) {
        // Create players
        if (player1Name || player2Name) {
            const player1 = playerFactory.player(player1Name, "X" , gameMode);
            const player2 = playerFactory.player(player2Name, "O", gameMode);    
            events.emit("playersCreated", {player1, player2});
        }
    }
    
})();

const gameDisplayController = (function () {
   
    const domElmts = {};

    // On game start remove btn listeners
    events.on("restartGame", resetBtnMove);
    events.on("newGame", resetBtnMove);
    events.on("newGame", addBtnRestartListener);
    events.on("newGame", addBtnMoveListener);


    // On game over removebtnMovelistener, declareResult, removebtnRestartlistener, resetBtnMove
    events.on("gameOver", removeBtnRestartListener);     
    events.on("gameOver", removeBtnMoveListener);
    events.on("gameOver", declareResult)

    // on computer turn removebtnmovelistener
    events.on("computerTurn", removeBtnMoveListener);
    events.on("computerMove", clickComputerChoice);
    events.on("computerMove", addBtnMoveListener);

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
            domElmts.grid = domElmts.grid || {};

            domElmts.grid[btn.id] = btn;
            domElmts.btnMove.push(btn);
        });
        events.emit("gridLoaded");
    }

    // Form functions
    function addFormListener () {
        domElmts.playersForm.addEventListener("submit", triggerFormSubmit);
    }

    function triggerFormSubmit (e) {
        e.preventDefault();
        events.emit("formSubmit", {
            player1Name: domElmts.player1Input.value, 
            player2Name: domElmts.player2Input.value,
            gameMode:  domElmts.playersForm.querySelector(`input[name='game-mode']:checked`).value
        });
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
        if (!this.textContent){
            markbtnMove(this)
            events.emit("registerMove", this)
        }
    }

    // btnMove specials
    function markbtnMove(btnMove) {
        btnMove.textContent = gameFlowController.getCurrentMark();
    }
    function resetBtnMove() {
        setTimeout( () => {
            domElmts.btnMove.forEach(btn => {
                btn.classList.remove("winner");
                btn.textContent = "";
            });
            events.emit("newGameBtnMoveResetDone")
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
        events.emit("restartGame");
    }

    // Display result
    function declareResult ({winBtns, player}) {
        if (player && winBtns) {
            winBtns.forEach(btn => {btn.classList.add("winner")})
            setTimeout(() => {
                alert(`${player.name} has won the game with ${player.moves} moves.`);
                events.emit("newGame")

            }, 300);
        }
        else {
            setTimeout(() => {
                alert("draw");
                events.emit("newGame")
            }, 300);
        }
    }
    function clickComputerChoice(btn) {
        if (!btn.textContent){
            markbtnMove(btn)
            events.emit("registerMove", btn)
        }
    }

    function getGrid() {
        return domElmts.grid;
    }
    return {getGrid};
})();

const gameFlowController = (function () {
    
    const gameData = {};

    events.on("playersCreated", registerPlayers);
    events.on("registerMove", registerMove);

    events.on("restartGame", resetGame);
    events.on("newGame", resetGame);
    events.on("newGameBtnMoveResetDone", assignPlayerTurn);

    
    function registerPlayers({player1, player2}) {
        gameData.player1 = player1;
        gameData.player2 = player2;
        events.emit("newGame");
    }
    function registerMove(btn) {
        updatePositions(btn);
        updatePlayerMoves(1);
        checkWinner(btn);
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
            if (resultBtns.filter(Boolean).length === 3 ) {
                saveHistory(resultBtns);
                events.emit("gameOver", {winBtns: resultBtns, player: gameData.currentPlayer});
                return;
            }
        }

        if (gameData.player1.moves + gameData.player2.moves === 9) {
            events.emit("gameOver", {});
        }
        else {
            assignPlayerTurn();
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
    function assignPlayerTurn(){
        gameData.currentPlayer = gameData.currentPlayer === gameData.player1 ? 
                gameData.player2 : gameData.player1;
        gameData.watchingPlayer =  gameData.currentPlayer === gameData.player1 ? 
                gameData.player2 : gameData.player1;
        gameData.currentPlayer.playerId === 0 ? 
            events.emit("computerTurn", {
                computer: gameData.currentPlayer, 
                opponent:gameData.watchingPlayer}) : undefined; 
    }
    function saveHistory(winBtns){
       let winnerIdentifier = gameData.currentPlayer.name + "-" + gameData.currentPlayer.playerId;
       gameData.history = gameData.history || {};
       gameData.history[winnerIdentifier] = gameData.history[winnerIdentifier] || [];
       gameData.history[winnerIdentifier].push([gameData.currentPlayer.moves, winBtns, gameData.watchingPlayer.name]);
    }
    function resetGame() {
        updatePositions();
        updatePlayerMoves();
    }
    function getCurrentMark() {
        return gameData.currentPlayer.mark;
    }
    return {getCurrentMark}
})();

(function Computer() {
    const grid = {};
    const lines = Array.from({length: 8}, () => []);

    events.on("gridLoaded", createGridLines);
    events.on("computerTurn", makeMove);

    // Create Grid Lines
    function createGridLines() {
        function getCell(row, col) {
            return grid.grid[`row${row}-col${col}`];
        }

        //Load grid
        grid.grid = gameDisplayController.getGrid()

        // Create the 8 lines
        for (let i =1; i < 4; i++) {
            for (let j = 1; j < 4; j++) {
                // lines: 0 1 2, horizontal
                lines.at(i-1).push(getCell(i, j));
                
                //lines: 3 4 5, vertical
                lines.at(i+2).push(getCell(j, i));             
            }

            // lines: 6, diagonal top-left to bottom-right 
            lines.at(-2).push(getCell(i, i));

            // lines: 7, diagonal top-right to bottom-left
            lines.at(-1).push(getCell(4-i, i));
        }
    }
    // Make move
    function makeMove({computer, opponent}) {
        // Create/reset cell score
        grid.score = {};
        grid.computer = computer;
        grid.opponent = opponent;

        // Score cell
        scoreCells();

        // Find strongest move value
        let bestCell = Object.entries(grid.score).toSorted((dictLike1, dictLike2) => dictLike1.at(-1)- dictLike2.at(-1)).at(-1);
        console.table("R:",Object.entries(grid.score).toSorted((dictLike1, dictLike2) => dictLike1.at(-1)- dictLike2.at(-1)))
        // Find strongest move valued cells
        let sameValuedCells = Object.entries(grid.score).filter(dictLike => dictLike.at(-1) === bestCell.at(-1));
        
        // Choose random move from best cells
        let randomizedBestCell = sameValuedCells.at(
            (Math.floor(Math.random() * sameValuedCells.length))
        );
        events.emit("computerMove", grid.grid[randomizedBestCell.at(0)])
    }
    // Score cells
    function scoreCells() {
        lines.forEach(line => {
            line.forEach((cell, index, array) => {
                // If empty cell rank strength
                !cell.textContent ? rankCell(cell, index, array) : undefined;
            });
        });
    }
    // score Logic
    function rankCell(cell, index, array) {

        let rest = array.toSpliced(index, 1);
        grid.score[cell.id] = grid.score[cell.id] || 0;             
                
        // Check 2 in a row for computer
        if (rest.every(restCell => restCell.textContent === grid.computer.mark)) {
            grid.score[cell.id] += 2000; 
        } 
        // Check 2 in a row for opponent
        else if (rest.every(restCell => restCell.textContent === grid.opponent.mark)) {
            grid.score[cell.id] += 1000; 
        }
        else if (grid.computer.gameMode === "bignner") {
            grid.score[cell.id] += 0;
        } 
        //Check 1 in line, score higher for middle restCell
        else if (
            rest.at(0).textContent && !rest.at(1).textContent ||
            !rest.at(0).textContent && rest.at(1).textContent
        ) {
                if (cell.id === "row2-col2") {
                    grid.score[cell.id] +=  grid.computer.gameMode === "expert" && !grid.computer.moves ? 500 : 56;    
                }
                else {
                    grid.score[cell.id] += grid.computer.gameMode === "expert" && !grid.computer.moves && 
                        (rest.at(0).id === "row2-col2" || rest.at(1).id === "row2-col2") ? 90 : 100;
                }   

        }
        //Check all empty, and not 1 of cptr and 1 opponent
        else if (rest.every(restCell => !restCell.textContent)) {
            grid.score[cell.id] += cell.id === "row2-col2" ? 14 : 20; 
        }  
    }
})();

//grid.Gamemode = "Expert"; input select
//history display
// add option to let players turn announcement using name or player1: name

// add difficulty level for computer player
// css
const c = console.log;