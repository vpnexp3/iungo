/**
 * @author Landmaster
 */

const Promise = require('bluebird');

/**
 *
 * @template T
 * @constructor
 * @augments Promise<T>
 */
function ManualResolvePromise() {
	Promise.call(this, (res, rej) => {
		this.resolve = res;
		this.reject = rej;
	});
}
ManualResolvePromise.prototype = Object.create(Promise.prototype);
module.exports = ManualResolvePromise;