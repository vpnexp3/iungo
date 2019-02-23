/**
 * @author Landmaster
 */

const getWS = require('./get_ws');

const ws = new WebSocket(getWS('/'));

let generateCodeBtn = document.getElementById('generate_code');
generateCodeBtn.addEventListener('click', () => {

});
