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

const historyCardFactory = (function () {
    function create (currentPlayer, opposingPlayer, winBtns, gameboardGrid) {
        
        const historyMessage =  `<div class="history info">
                                    <span class="name">${currentPlayer.name}</span> with ${currentPlayer.moves} moves <em>${winBtns ? "wins" : "draws"}</em> 
                                    against <span class="name">${opposingPlayer.name}</span> with ${opposingPlayer.moves} moves.
                                </div>
                                <div class="history gameboard">
                                    ${gameboardGrid}
                                </div>`;
        
        
        const historyCard = document.createElement("div");
        historyCard.className = "history card";
        historyCard.innerHTML = historyMessage;

        return historyCard;
    }
    return {create}
})();

const gameDisplayController = (function () {
   
    const domElmts = {};
    
    // When player turn changes
    events.on("turnChange", updateCurrentTurn);
    
    // Game ended and result is being declared
    events.on("gameOver", removeBtnListeners);
    
    // remove listeners, new form submitted and grid being reset,
    // Reset grid, incase new game started, in a middle of game, 
    // and prepare turn display
    events.on("playersCreated", removeBtnListeners);
    events.on("playersCreated", resetBtnGrid);
    events.on("playersCreated", prepareTurnDisplay);

    // Computer equivalent for triggerBtnGridClick
    events.on("computerMove", triggerBtnGridClick);

    // Update history display with result
    events.on("gameOver", declareResult);

    window.addEventListener("DOMContentLoaded", () => {
        cacheDom();
        addFormListener();

        // Initiate First Game with computer player and default player("Jane Doe")
        let clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            client: window
        });   
        domElmts.playersForm.querySelector(".btn[type='submit']").dispatchEvent(clickEvent);
        
    });

    // Cache DOM
    function cacheDom() {
        
        // Cache current player display
        domElmts.currentPlayerName = document.querySelector(".current-player .name");
        domElmts.currentPlayerMark = document.querySelector(".current-player .mark");
        
        // Cache form elmts
        domElmts.playersForm = document.querySelector("form#players");

        domElmts.player1Input = domElmts.playersForm.querySelector("input#player1");
        domElmts.player2Input = domElmts.playersForm.querySelector("input#player2");

        domElmts.btnRestart = domElmts.playersForm.querySelector("button[type='button']");

        // Cache gameboard elmts
        domElmts.gameboard = {gameboard: null, gridBtns: {}};      // Prepare object for caching gameboard and gameboard btns
        domElmts.gameboard.gameboard = document.querySelector(".gameboard");         // Cache gameboard
        domElmts.gameboard.gameboard.querySelectorAll(".btn-move").forEach(btn => {         // Cache gameboard btns
            domElmts.gameboard.gridBtns[btn.dataset.cell] = btn;
        });

        // Cahe history elmt
        domElmts.historyContainer = document.querySelector(".history-container");

        events.emit("gridBtnsLoaded", domElmts.gameboard.gridBtns);
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

    // Turn functions
    function prepareTurnDisplay({player1, player2}) {
        domElmts.turnDisplay = {};
        domElmts[`player-${player1.playerId}`] = document.querySelector(".turn-display-container .player-1");
        domElmts[`player-${player2.playerId}`] = document.querySelector(".turn-display-container .player-2");
        
        domElmts[`player-${player1.playerId}`].querySelector(".name").textContent = player1.name;
        domElmts[`player-${player1.playerId}`].querySelector(".mark").textContent = player1.mark;
        
        domElmts[`player-${player2.playerId}`].querySelector(".name").textContent = player2.name;
        domElmts[`player-${player2.playerId}`].querySelector(".mark").textContent = player2.mark;
    }
    function updateCurrentTurn({currentPlayer, opposingPlayer}) {

        // Cache player for markingboard
        domElmts.currentPlayer = currentPlayer;

        // Update display
        domElmts[`player-${currentPlayer.playerId}`].id = "active";
        domElmts[`player-${opposingPlayer.playerId}`].id = "";

        // Remove Btn listener if computer's turn, add them if players turn 
        currentPlayer.playerId === 0 ? removeBtnListeners() : addBtnListeners();        
    }
    
    // General btn functions, adapters
    function addBtnListeners() {
        if (domElmts.btnListeners) return;
        
        addBtnRestartListener();
        addBtnGridListener();

        // Set flag false
        domElmts.btnListeners = true;
    }
    function removeBtnListeners () {
        if (!domElmts.btnListeners) return;
        
        removeBtnRestartListener();   
        removeBtnGridListener();

        // Set flag to false
        domElmts.btnListeners = false;
    }

    // btnGrid functions
    function addBtnGridListener() {
        domElmts.gameboard.gameboard.addEventListener("click", triggerBtnGridClick);     
    }
    function removeBtnGridListener() {
        domElmts.gameboard.gameboard.removeEventListener("click", triggerBtnGridClick);
    }
    function triggerBtnGridClick(btn) {
        // if event, stop propagation and assign event target as btn
        if (btn.target) {
            btn.stopPropagation();
            btn = btn.target;
        }
        if (!btn.textContent){
            markbtnMove(btn);
            events.emit("registerMove", btn);
            btn.dataset.checked = true;
        }
    }
    function markbtnMove(btnGrid) {
        btnGrid.textContent = domElmts.currentPlayer.mark;
    }
    function resetBtnGrid() {
        setTimeout(() => {
            Object.values(domElmts.gameboard.gridBtns).forEach(btn => {
                btn.classList.remove("winner");
                btn.dataset.checked="";
                btn.textContent = "";
            });
            events.emit("gridReset")
        }, 1000);
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
        removeBtnListeners();
        resetBtnGrid();
    }

    // Show result
    function declareResult ({currentPlayer, opposingPlayer, winBtns}) {
    
        // Style btns
        if (winBtns) winBtns.forEach(winBtn => {winBtn.classList.add("winner")});

        // Create History div
        const historyCard = historyCardFactory.create(currentPlayer, opposingPlayer, winBtns, domElmts.gameboard.gameboard.innerHTML);
        
        // update history Display
        updateHistoryDisplay(currentPlayer, historyCard);
        
        // Reset grid   
        resetBtnGrid();
    }
    function updateHistoryDisplay(player, historyCard) {
        let playerIdentifier = "player" + player.name.split(" ").join("_") + "-" + player.playerId;
        let historyWrapper = domElmts.historyContainer.querySelector(`.history.wrapper.${playerIdentifier}`);

        // If exist remove , else create prepend with card as first child
        if (historyWrapper) {
            domElmts.historyContainer.removeChild(historyWrapper);
            historyWrapper.prepend(historyCard);
        }
        else {
            historyWrapper = document.createElement("div");
            historyWrapper.className = `history wrapper ${playerIdentifier}`;
            historyWrapper.append(historyCard);
        }

        // Prepend wrapper
        domElmts.historyContainer.prepend(historyWrapper);
    }

})();

const gameFlowController = (function () {
    
    const gameData = {};

    events.on("gridReset", startNewGame);
    events.on("playersCreated", registerPlayers);
    events.on("registerMove", registerMove);

    function startNewGame() {
        resetGame();
        assignPlayerTurn();
    }

    // Create players
    function registerPlayers({player1, player2}) {
        gameData.player1 = player1;
        gameData.player2 = player2;
    }

    // Game Flow operation
    function registerMove(btn) {
        updatePositions(btn);
        updatePlayerMoves(1);
        checkResult(btn);
    }
  
    // Helper funs for registering move
    function updatePlayerMoves(by) {
        by = by ?? 0;
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
            gameData.currentPlayer.positions[btn.dataset.cell] = btn;
        }
        else {
            delete gameData.player1?.positions; 
            delete gameData.player2?.positions;
        }
    }
    function checkResult(btn) {
        
        const [row, col] = btn.dataset.cell.split("-").map(coordinateVal => parseInt(coordinateVal.at(-1)));

        for (let resultBtns of checkCellLines(row, col)) { 
            if (resultBtns.filter(Boolean).length === 3 ) {
                events.emit("gameOver", {currentPlayer: gameData.currentPlayer, opposingPlayer: gameData.opposingPlayer, winBtns: resultBtns});
                return;
            }
        }

        if (gameData.player1.moves + gameData.player2.moves === 9) {
            events.emit("gameOver", {currentPlayer: gameData.currentPlayer, opposingPlayer: gameData.opposingPlayer});
        }
        else {
            assignPlayerTurn();
        }
    }
  
    // Helper funs for checking result 
    function checkCellLines(row, col) {
        
        let vertical = [], 
            horizontal = [],
            diagLeft = [], 
            diagRight =[];

        for (let i = 1; i < 4; i++) {
            // Check vertical
            vertical.push(checkCell(i, col)); 

            // Check horizontal
            horizontal.push(checkCell(row, i)); 

            // If middle point, check both diagonals
            if (row === col && row === 2) {

                // Check top-left to bottom-right diagonal
                diagLeft.push(checkCell(i, i));
                
                // Check top-right to bottom-left diagonal
                diagRight.push(checkCell(i, 4-i));
            }
            // 
            else if (row === col) {

                // Check top-left to bottom-right diagonal
                diagLeft.push(checkCell(i, i));
            }
            else if (Math.abs(row-col) === 2) {

                // Check top-right to bottom-left diagonal
                diagRight.push(checkCell(i, 4-i));                
            }
        }
        return [vertical, horizontal, diagLeft, diagRight];
    }
    function checkCell(row, col) {
        return gameData.currentPlayer.positions[`row${row}-col${col}`];
    }
    function assignPlayerTurn(){
        gameData.currentPlayer = gameData.currentPlayer === gameData.player1 ? 
                gameData.player2 : gameData.player1;
        
        gameData.opposingPlayer =  gameData.currentPlayer === gameData.player1 ? 
                gameData.player2 : gameData.player1;
        
        events.emit("turnChange", {
            currentPlayer: gameData.currentPlayer, 
            opposingPlayer: gameData.opposingPlayer
        });
    }

    function resetGame() {
        updatePositions();
        updatePlayerMoves();
    }

})();

(function playerFactory() {

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

(function Computer() {
    const grid = {};
    const lines = Array.from({length: 8}, () => []);

    events.on("gridBtnsLoaded", createGridLines);
    events.on("turnChange", makeMove);

    // Create Grid Lines
    function createGridLines(gridBtns) {
        function getCell(row, col) {
            return grid.gridBtns[`row${row}-col${col}`];
        }

        //Load gridBtns
        grid.gridBtns = gridBtns;

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
    function makeMove({currentPlayer, opposingPlayer}) {

        // If not computer's turn return
        if (currentPlayer.playerId !== 0) return;

        // Create/reset cell score
        grid.score = {};
        grid.computer = currentPlayer;
        grid.opponent = opposingPlayer;

        // Score cell
        scoreCells();

        // Find strongest move value
        let bestCell = Object.entries(grid.score).toSorted((dictLike1, dictLike2) => dictLike1.at(-1)- dictLike2.at(-1)).at(-1);
        // Find strongest move valued cells
        let sameValuedCells = Object.entries(grid.score).filter(dictLike => dictLike.at(-1) === bestCell.at(-1));
        
        // Choose random move from best cells
        let randomizedBestCell = sameValuedCells.at(
            (Math.floor(Math.random() * sameValuedCells.length))
        );
    
        setTimeout(() => {
            events.emit("computerMove", grid.gridBtns[randomizedBestCell.at(0)]);            
        }, 1000);
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
        grid.score[cell.dataset.cell] = grid.score[cell.dataset.cell] || 0;             
                
        // Check 2 in a row for computer
        if (rest.every(restCell => restCell.textContent === grid.computer.mark)) {
            grid.score[cell.dataset.cell] += 2000; 
        } 
        // Check 2 in a row for opponent
        else if (rest.every(restCell => restCell.textContent === grid.opponent.mark)) {
            grid.score[cell.dataset.cell] += 1000; 
        }
        else if (grid.computer.gameMode === "bignner") {
            grid.score[cell.dataset.cell] += 0;
        } 
        //Check 1 in line, score higher for middle restCell
        else if (
            rest.at(0).textContent && !rest.at(1).textContent ||
            !rest.at(0).textContent && rest.at(1).textContent
        ) {
                if (cell.dataset.cell === "row2-col2") {
                    grid.score[cell.dataset.cell] +=  grid.computer.gameMode === "expert" && !grid.computer.moves ? 500 : 56;    
                }
                else {
                    grid.score[cell.dataset.cell] += grid.computer.gameMode === "expert" && !grid.computer.moves && 
                        (rest.at(0).dataset.cell === "row2-col2" || rest.at(1).dataset.cell === "row2-col2") ? 90 : 100;
                }   

        }
        //Check all empty, and not 1 of cptr and 1 opponent
        else if (rest.every(restCell => !restCell.textContent)) {
            grid.score[cell.dataset.cell] += cell.dataset.cell === "row2-col2" ? 14 : 20; 
        }  
    }
})();
