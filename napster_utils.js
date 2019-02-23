/**
 * @author Landmaster
 */

const NapsterUtils = {};

NapsterUtils.refresh = function (callback) {
	jQuery.ajax({
		url: '/reauthorize',
		method: 'GET',
		data: { refreshToken: Napster.member.refreshToken },
		success: function(data) {
			Napster.member.set({
				accessToken: data.access_token,
				refreshToken: data.refresh_token
			});
			if (callback) {
				callback(data);
			}
		}
	});
};

NapsterUtils.getParameters = function () {
	let query = window.location.search.substring(1);
	let parameters = {};
	if (query) {
		query.split('&').forEach(function(item) {
			let param = item.split('=');
			parameters[param[0]] = param[1];
		});
	}
	return parameters;
};


module.exports = NapsterUtils;