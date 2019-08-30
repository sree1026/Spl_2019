
/*
 * index.js
 *
 * This file is the entry point for Starter Bot.
 *
 * The port and host of the SBOX can be changed here.
 *
 */

const PORT = 2019;
const HOST = 'localhost';
const Bot = require('./bot.js');

new Bot(HOST, PORT).start();

