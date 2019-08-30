/*
 * splClient.js
 *
 * This class handles the low level communication protocol
 * required between Bot and SBOX.
 *
 */


const net = require('net');

function toBytes(num) {
    let bytes = [0, 0, 0, 0];

    for (let i = bytes.length - 1; i>=0; i--) {
        let byte = num & 0xff;
        bytes[i] = byte;
        num = (num - byte) / 256;
    }

    return bytes;
}

function toNum(bytes) {
    let value = 0;
    for (let i = 0; i<bytes.length; i++) {
        value = (value * 256) + bytes[i];
    }

    return value;
}

class SplClient {
    constructor(host, port, recieve) {
        this.host = host;
        this.port = port;
        this.recieve = recieve;
        this.data = [];
    }

    /*
     * Send data to SBOX.
     *
     * Make sure that the `data` parameter is a JavaScript
     * object with no cyclic dependencies.
     *
     */
    respond(data) {
        let bufData = Buffer.from(JSON.stringify(data), 'utf8');
        let bufLen = Buffer.from(toBytes(bufData.length));

        this.socket.write(Buffer.concat([bufLen, bufData]));
    }

    /*
     * Establish connection to SBOX and listen to the the data from it.
     * Once enough data is there, call the `recieve` callback available
     * from the constructor
     *
     */
    listen() {
        let self = this;

        // Avoid multiple connections from splClient at the same time
        // using `self.listeing` bool.
        if (!self.listening) {
            self.listening = true;

            self.socket = new net.Socket();
            self.socket.on('data', self._process_data.bind(self));
            self.socket.on('error', error => {
                console.log('Socket Error', error);
            });
            self.socket.on('close', () => {
                self.listening = false;

                setTimeout(() => {
                    console.log('Socket Closed: Attempting to connect again');
                    self.listen();
                }, 2000);
            });

            self.socket.connect(this.port, this.host, () => {
                console.log('Connected');
            });
        }
    }

    _process_data(data) {
        this.data.push.apply(this.data, data);

        // Drain all the data to rx
        let hasMoreData = true;
        while(hasMoreData && this.data.length > 4) {
            let length = toNum(this.data.slice(0, 4));
            hasMoreData = false;
            if (this.data.length >= length + 4) {
                hasMoreData = true;
                let rxData = this.data.splice(0, length + 4);
                let rxJson = JSON.parse(Buffer.from(rxData.slice(4)).toString());

                this.recieve(rxJson);
            }
        }
    }
}

module.exports = SplClient;
