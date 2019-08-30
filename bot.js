/*
 * bot.js
 *
 * Main logic of the bot resides in this file.
 *
 * This Bot class recieves an incoming request, look at the
 * data, figures out the response and then send it back.
 *
 */

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
            switch(data.dataType.trim()) {
                case "authentication" :
                    this.authentication(data);
                    break;
                case "command" :
                    this.command(data);
                    break;
                case "acknowledge" :
                    this.acknowledgement(data);
                    break;
                case "result" :
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

        for(let i=0; i< rows; i++) {
            for(let j=0; j<columns; j++) {
                if(boardInfo[i][j] === 0){
                    return [i, j];
                }
            }
        }

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
