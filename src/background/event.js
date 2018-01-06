var cipevent = {};

cipevent.onMessage = function(request, sender, callback) {
	if (request.action in cipevent.messageHandlers) {
		//console.log("onMessage(" + request.action + ") for #" + sender.tab.id);

		if(!sender.hasOwnProperty('tab') || sender.tab.id < 1) {
			sender.tab = {};
			sender.tab.id = page.currentTabId;
		}

		cipevent.invoke(cipevent.messageHandlers[request.action], callback, sender.tab.id, request.args);

		// onMessage closes channel for callback automatically
		// if this method does not return true
		if(callback) {
			return true;
		}
	}
}

/**
 * Get interesting information about the given tab.
 * Function adapted from AdBlock-Plus.
 *
 * @param {function} handler to call after invoke
 * @param {function} callback to call after handler or null
 * @param {integer} senderTabId
 * @param {array} args
 * @param {bool} secondTime
 * @returns null (asynchronous)
 */
cipevent.invoke = function(handler, callback, senderTabId, args, secondTime) {
	if(senderTabId < 1) {
		return;
	}

	if(!page.tabs[senderTabId]) {
		page.createTabEntry(senderTabId);
	}

	// remove information from no longer existing tabs
	page.removePageInformationFromNotExistingTabs();

	browser.tabs.get(senderTabId).then(function(tab) {
		if(!tab) {
			return;
		}

		if (!tab.url) {
			// Issue 6877: tab URL is not set directly after you opened a window
			// using window.open()
			if (!secondTime) {
				window.setTimeout(function() {
					cipevent.invoke(handler, callback, senderTabId, args, true);
				}, 250);
			}
			return;
		}

		if(!page.tabs[tab.id]) {
			page.createTabEntry(tab.id);
		}

		args = args || [];

		args.unshift(tab);
		args.unshift(callback);

		if(handler) {
			handler.apply(this, args);
		}
		else {
			console.log("undefined handler for tab " + tab.id);
		}
	});
}

cipevent.onShowAlert = function(callback, tab, message) {
	if( page.settings.supressAlerts === true ){ console.log(message); }
	else { browser.tabs.executeScript({code: 'alert(\''+message+'\')'}); }
}

cipevent.onLoadSettings = function(callback, tab) {
	page.initSettings().then((settings) => {
		callback(settings);
	}, (err) => {
		console.log('error loading settings: ' + err);
	});
}

cipevent.onLoadKeyRing = function(callback, tab) {
	browser.storage.local.get({'keyRing': {}}).then(function(item) {
		keepass.keyRing = item.keyRing;
		if(keepass.isAssociated() && !keepass.keyRing[keepass.associated.hash]) {
			keepass.associated = {
				"value": false,
				"hash": null
			};
		}
		callback(item.keyRing);
	}, (err) => {
		console.log('error loading keyRing: ' + err);
	});
}

cipevent.onSaveSettings = function(callback, tab, settings) {
	browser.storage.local.set({'settings': settings}).then(function() {
		cipevent.onLoadSettings();
	});
}

cipevent.onGetStatus = function(callback, tab) {
	keepass.testAssociation(tab).then((configured) => {
		var keyId = null;
		if (configured) {
			keyId = keepass.keyRing[keepass.databaseHash].id;
		}

		browserAction.showDefault(null, tab);

		callback({
			identifier: keyId,
			configured: configured,
			databaseClosed: keepass.isDatabaseClosed,
			keePassHttpAvailable: keepass.isKeePassHttpAvailable,
			encryptionKeyUnrecognized: keepass.isEncryptionKeyUnrecognized,
			associated: keepass.isAssociated(),
			error: page.tabs[tab.id].errorMessage
		});
	});
}

cipevent.onPopStack = function(callback, tab) {
	browserAction.stackPop(tab.id);
	browserAction.show(null, tab);
}

cipevent.onGetTabInformation = function(callback, tab) {
	var id = tab.id || page.currentTabId;

	callback(page.tabs[id]);
}

cipevent.onGetConnectedDatabase = function(callback, tab) {
	callback({
		"count": Object.keys(keepass.keyRing).length,
		"identifier": (keepass.keyRing[keepass.associated.hash]) ? keepass.keyRing[keepass.associated.hash].id : null
	});
}

cipevent.onGetKeePassHttpVersions = function(callback, tab) {
	if(keepass.currentKeePassHttp.version == 0) {
		keepass.getDatabaseHash(tab).then(() => {
			callback({"current": keepass.currentKeePassHttp.version, "latest": keepass.latestKeePassHttp.version});
		});
	} else {
		callback({"current": keepass.currentKeePassHttp.version, "latest": keepass.latestKeePassHttp.version});
	}
}

cipevent.onCheckUpdateKeePassHttp = function(callback, tab) {
	keepass.checkForNewKeePassHttpVersion();
	callback({"current": keepass.currentKeePassHttp.version, "latest": keepass.latestKeePassHttp.version});
}

cipevent.onUpdateAvailableKeePassHttp = function(callback, tab) {
	callback(keepass.keePassHttpUpdateAvailable());
}

cipevent.onRemoveCredentialsFromTabInformation = function(callback, tab) {
	var id = tab.id || page.currentTabId;

	page.clearCredentials(id);
}

cipevent.onSetRememberPopup = function(callback, tab, username, password, url, usernameExists, credentialsList) {
	browserAction.setRememberPopup(tab.id, username, password, url, usernameExists, credentialsList);
}

cipevent.onLoginPopup = function(callback, tab, logins) {
	var stackData = {
		level: 1,
		iconType: "questionmark",
		popup: "popup_login.html"
	}
	browserAction.stackUnshift(stackData, tab.id);

	page.tabs[tab.id].loginList = logins;

	browserAction.show(null, tab);
}

cipevent.onHTTPAuthPopup = function(callback, tab, data) {
	var stackData = {
		level: 1,
		iconType: "questionmark",
		popup: "popup_httpauth.html"
	}
	browserAction.stackUnshift(stackData, tab.id);

	page.tabs[tab.id].loginList = data;

	browserAction.show(null, tab);
}

cipevent.onMultipleFieldsPopup = function(callback, tab) {
	var stackData = {
		level: 1,
		iconType: "normal",
		popup: "popup_multiple-fields.html"
	}
	browserAction.stackUnshift(stackData, tab.id);

	browserAction.show(null, tab);
}

cipevent.pageClearLogins = function(callback, tab) {
	page.clearLogins(tab.id);
	callback();
}

cipevent.isFirefox = function(callback) {
	callback(utils.isFirefox);
}

cipevent.initHttpAuth = function(callback) {
	httpAuth.init();
	callback();
}

// all methods named in this object have to be declared BEFORE this!
cipevent.messageHandlers = {
	'add_credentials': keepass.addCredentials,
	'alert': cipevent.onShowAlert,
	'associate': keepass.associate,
	'check_update_keepasshttp': cipevent.onCheckUpdateKeePassHttp,
	'get_connected_database': cipevent.onGetConnectedDatabase,
	'get_keepasshttp_versions': cipevent.onGetKeePassHttpVersions,
	'get_status': cipevent.onGetStatus,
	'get_tab_information': cipevent.onGetTabInformation,
	'init_http_auth': cipevent.initHttpAuth,
	'load_keyring': cipevent.onLoadKeyRing,
	'load_settings': cipevent.onLoadSettings,
	'page_clear_logins': cipevent.pageClearLogins,
	'pop_stack': cipevent.onPopStack,
	'popup_login': cipevent.onLoginPopup,
	'popup_multiple-fields': cipevent.onMultipleFieldsPopup,
	'remove_credentials_from_tab_information': cipevent.onRemoveCredentialsFromTabInformation,
	'retrieve_credentials': keepass.retrieveCredentials,
	'show_default_browseraction': browserAction.showDefault,
	'update_credentials': keepass.updateCredentials,
	'save_settings': cipevent.onSaveSettings,
	'set_remember_credentials': cipevent.onSetRememberPopup,
	'stack_add': browserAction.stackAdd,
	'update_available_keepasshttp': cipevent.onUpdateAvailableKeePassHttp,
	'generate_password': keepass.generatePassword,
	'is_firefox': cipevent.isFirefox
};
