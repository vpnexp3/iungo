/**
 * @author Landmaster
 */

/**
 *
 * @type {Map<string, Element>}
 */
const viewMap = new Map();

const viewToLinkID = new Map();

const ViewManager = {};
ViewManager.addView = function (viewID) {
	viewMap.set(viewID, document.getElementById(viewID));
};
ViewManager.setView = function (viewID) {
	for ([id, view] of viewMap) {
		if (id === viewID || (viewToLinkID.has(id) && viewToLinkID.has(viewID) && viewToLinkID.get(id) === viewToLinkID.get(viewID))) {
			view.style.display = '';
		} else {
			view.style.display = 'none';
		}
	}
};
ViewManager.linkViews = function (cname, ...viewIDs) {
	for (let viewID of viewIDs) {
		viewToLinkID.set(viewID, viewIDs);
		viewMap.get(viewID).classList.add(cname);
	}
};
module.exports = ViewManager;