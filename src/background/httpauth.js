var httpAuth = httpAuth || {};

httpAuth.requests = {};

httpAuth.requestCompleted = function (details) {
	var req = httpAuth.requests[details.requestId];
	if (req) {
		delete httpAuth.requests[details.requestId];
	}
}

httpAuth.handleRequestPromise = function (details) {
	return new Promise((resolve, reject) => {
		httpAuth.processPendingCallbacks(details, resolve, reject);
	});
}

httpAuth.handleRequestCallback = function (details, callback) {
	httpAuth.processPendingCallbacks(details, callback, callback);
}

httpAuth.processPendingCallbacks = function (details, resolve, reject) {

	if (!page.tabs[details.tabId]) {
		reject({});
		return;
	}

	var creds = httpAuth.requests[details.requestId];
	if (creds) {
		httpAuth.loginOrShowCredentials(creds, details, resolve, reject);
		return;
	}

	if (details.challenger) {
		details.proxyUrl = details.challenger.host;
	}

	details.searchUrl = (details.isProxy && details.proxyUrl) ? details.proxyUrl : details.url;

	keepass.retrieveCredentials((logins) => {
		httpAuth.loginOrShowCredentials(logins, details, resolve, reject);
	}, { "id": details.tabId }, details.searchUrl, details.searchUrl, true);
}

httpAuth.loginOrShowCredentials = function (logins, details, resolve, reject) {
	// at least one login found --> use first to login
	if (logins.length > 0) {
		cipevent.onHTTPAuthPopup(null, { "id": details.tabId }, { "logins": logins, "url": details.searchUrl });
		//generate popup-list for HTTP Auth usernames + descriptions
		if (page.settings.autoFillAndSend) {
			var creds = logins.shift();
			httpAuth.requests[details.requestId] = logins;
			resolve({
				authCredentials: {
					username: creds.Login,
					password: creds.Password
				}
			});
		} else {
			reject({});
		}
	}
	// no logins found
	else {
		reject({});
	}
}
