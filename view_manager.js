/**
 * @author Landmaster
 */

/**
 *
 * @type {Map<string, Element>}
 */
const viewMap = new Map();

const ViewManager = {};
ViewManager.addView = function (viewID) {
	viewMap.set(viewID, document.getElementById(viewID));
};
ViewManager.setView = function (viewID) {
	for ([id, view] of viewMap) {
		if (id === viewID) {
			view.style.display = '';
		} else {
			view.style.display = 'none';
		}
	}
};
module.exports = ViewManager;