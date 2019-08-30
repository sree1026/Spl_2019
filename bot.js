/*
 * bot.js
 *
 * Main logic of the bot resides in this file.
 *
 * This Bot class recieves an incoming request, look at the
 * data, figures out the response and then send it back.
 *
 */
var flag = 0;
const SplClient = require('./splClient.js');

class Bot {
    constructor(host, port) {
        this.splClient = new SplClient(host, port, this.request.bind(this));
    }

    start() {
        this.splClient.listen();
    }

    /*
     * Entry point for each incoming request from SBOX
     *
     */
    request(data) {
        try {
            switch (data.dataType.trim()) {
                case "authentication":
                    this.authentication(data);
                    break;
                case "command":
                    this.command(data);
                    break;
                case "acknowledge":
                    this.acknowledgement(data);
                    break;
                case "result":
                    this.result(data);
                    break;
            }
        } catch (err) {
            console.error("Error processing request");
            console.error(err);
        }
    }

    authentication(data) {
        // Send back the one-time-password that
        // was received in the request.
        let response = {
            dataType: 'oneTimePassword',
            oneTimePassword: data.oneTimePassword,
        };
        this.splClient.respond(response);
    }

    acknowledgement(data) {
        console.log("Ack :: status :", data.message);
    }

    result(data) {
        console.log("Game over ::", data.result);
    }

    horizontalDefensive(rows, columns, boardInfo, oppChargeID) {
        for (let i = 0; i < rows; i++) {
            let horizontalSequenceCount = 0;
            for (let j = 0; j < columns; j++) {
                if(boardInfo[i][j] === oppChargeID) {
                    horizontalSequenceCount++;
                }
                else {
                    horizontalSequenceCount = 0;
                }
                if(horizontalSequenceCount === 3) {
                    console.log()
                    if(boardInfo[i][j+1] === 0) {
                        return [i, j+1];
                    }
                    else if(boardInfo[i][j-3] === 0) {
                        return [i, j-3];
                    }
                }
            }
        }
        return [];
    }
    
    verticalDefensive(rows, columns, boardInfo, oppChargeID) {
        for (let i = 0; i < columns; i++) {
            let verticalSequenceCount = 0;
            for (let j = 0; j < rows; j++) {
                if(boardInfo[j][i] === oppChargeID) {
                    verticalSequenceCount++;
                }
                else {
                    verticalSequenceCount = 0;
                }
                if(verticalSequenceCount === 3) {
                    if(boardInfo[j+1][i] === 0) {
                        return [j+1, i];
                    }
                    else if(boardInfo[j-3][i] === 0) {
                        return [j-3, i];
                    }
                }
            }
        }
        return [];
    }

    defensiveMove(rows, columns, boardInfo, oppChargeID) {
        let resultMove = this.horizontalDefensive(rows, columns, boardInfo, oppChargeID);
        if( resultMove.length !== 0 ) {
            return resultMove;
        }
        resultMove = this.verticalDefensive(rows, columns, boardInfo, oppChargeID);
        if( resultMove.length !== 0 ) {
            return resultMove;
        }
        return [];
    }
    
    horizontalOffensive(rows, columns, boardInfo, myChargeID) {
        for (let i = 0; i < rows; i++) {
            let horizontalSequenceCount = 0;
            for (let j = 0; j < columns; j++) {
                if(boardInfo[i][j] === myChargeID) {
                    horizontalSequenceCount++;
                }
                else {
                    horizontalSequenceCount = 0;
                }
                if(horizontalSequenceCount === 3) {
                    console.log()
                    if(boardInfo[i][j+1] === 0) {
                        return [i, j+1];
                    }
                    else if(boardInfo[i][j-3] === 0) {
                        return [i, j-3];
                    }
                }
            }
        }
        return [];
    }
    
    verticalOffensive(rows, columns, boardInfo, myChargeID) {
        for (let i = 0; i < columns; i++) {
            let verticalSequenceCount = 0;
            for (let j = 0; j < rows; j++) {
                if(boardInfo[j][i] === myChargeID) {
                    verticalSequenceCount++;
                }
                else {
                    verticalSequenceCount = 0;
                }
                if(verticalSequenceCount === 3) {
                    if(boardInfo[j+1][i] === 0) {
                        return [j+1, i];
                    }
                    else if(boardInfo[j-3][i] === 0) {
                        return [j-3, i];
                    }
                }
            }
        }
        return [];
    }

    offensiveMove(rows, columns, boardInfo, myChargeID) {
        let resultMove = this.horizontalOffensive(rows, columns, boardInfo, myChargeID);
        if( resultMove.length !== 0 ) {
            return resultMove;
        }
        resultMove = this.verticalOffensive(rows, columns, boardInfo, myChargeID);
        if( resultMove.length !== 0 ) {
            return resultMove;
        }
        return [];
    }

    linearOrder(rows, columns, boardInfo) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                if (boardInfo[i][j] === 0) {
                    return [i, j]
                }
            }
        }
        return [];
    }

    processData(data) {
        let boardInfo = data.boardInfo;
        let myChargeID = data.yourID;
        let errCount = data.errorCount;
        let turnNumber = data.turnNumber;
        let boardSize = data.boardSize;
        let grantedSP = data.grantedSP;
        let usedSP = data.usedSP;
        let mySP = data.yourSP;
        
        let rows = boardSize[0];
        let columns = boardSize[1];
        let oppChargeID = (myChargeID === 1)? 2 : 1;

        let resultMove = this.defensiveMove(rows, columns, boardInfo, oppChargeID);
        if (resultMove.length !== 0) {
            return resultMove;
        }
        resultMove = this.offensiveMove(rows, columns, boardInfo, myChargeID);
        if (resultMove.length !== 0) {
            return resultMove;
        }
        return this.linearOrder(rows, columns, boardInfo);
    }

    command(data) {
        console.log("Request data:", data);

        //
        let responseCellCoordinate = this.processData(data);
        //

        let response = {
            dataType: "response",
            cell: responseCellCoordinate,
            particleType: "C",
        };

        console.log("Respond move:", response);
        this.splClient.respond(response);
    }
}

module.exports = Bot;
