/**
 * @author Landmaster
 */

const getWS = path => (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.hostname + (location.port ? ':'+location.port : '') + path;
module.exports = getWS;