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
    // checkHorizontal(boardInfo, data) {
    //     let boardSize = data.boardSize;
    //     let rows = boardSize[0];
    //     let opponentId = data.yourID === 1 ? 2 : 1;
    //     console.log("OPPONENT ID ========== ", opponentId);
    //     let columns = boardSize[1];
    //     let move = [];
    //     let count = 0;
    //     for (let i = 0; i < rows; i++) {
    //         for (let j = 0; j < columns; j++) {
    //             if (boardInfo[i][j] === opponentId && boardInfo[i][j + 1] === opponentId && boardInfo[i][j + 2] === opponentId) {
    //                 if (j + 3 < columns && boardInfo[i][j + 3] === 0) {
    //                     return [i][j + 3];
    //                 } else {
    //                     return 0;
    //                 }
    //             } else {
    //                 return 0;
    //             }
    //         }
    //     }
    // }

    horizontalOffensive(rows, columns, boardInfo, myChargeID) {
        for (let i = 0; i < rows; i++) {
            let horizontalSequenceCount = 0;
            for (let j = 0; j < columns; j++) {
                if(boardInfo[i][j] === myChargeID) {
                    horizontalSequenceCount++;
                }
                if(horizontalSequenceCount === 3) {
                    if(boardInfo[i][j+1] === 0) {
                        return [i, j+1];
                    }
                    else if(boardInfo[i][j-1] === 0) {
                        return [i, j-1];
                    }
                }
            }
        }
        return [];
    }

    offensiveMove(rows, columns, boardInfo, myChargeID) {
        return this.horizontalOffensive(rows, columns, boardInfo, myChargeID);
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
        let opponentChargeId = (myChargeID === 1)? 2 : 1;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                if (boardInfo[i][j] === opponentChargeId && boardInfo[i][j + 1] === opponentChargeId && boardInfo[i][j + 2] === opponentChargeId) {
                    if (j + 3 < columns && boardInfo[i][j + 3] === 0) {
                        return [i, j + 3];
                    }
                }
            }
        }

        let resultMove = this.offensiveMove(rows, columns, boardInfo, myChargeID);
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
