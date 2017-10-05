// since version 2.0 the extension is using a keyRing instead of a single key-name-pair
keepass.migrateKeyRing().then(() => {
	// load settings
	page.initSettings().then(() => {
		page.initOpenedTabs().then(() => {
			// initial connection with KeePassHttp
			keepass.getDatabaseHash({ id: page.currentTabId });
		});
	});
});

// Milliseconds for intervall (e.g. to update browserAction)
var _interval = 250;

/**
 * Generate information structure for created tab and invoke all needed
 * functions if tab is created in foreground
 * @param {object} tab
 */
browser.tabs.onCreated.addListener(function(tab) {
	if(tab.id > 0) {
		//console.log("browser.tabs.onCreated(" + tab.id+ ")");
		if(tab.selected) {
			page.currentTabId = tab.id;
			cipevent.invoke(page.switchTab, null, tab.id, []);
		}
	}
});

/**
 * Remove information structure of closed tab for freeing memory
 * @param {integer} tabId
 * @param {object} removeInfo
 */
browser.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	delete page.tabs[tabId];
	if(page.currentTabId == tabId) {
		page.currentTabId = -1;
	}
});

/**
 * Remove stored credentials on switching tabs.
 * Invoke functions to retrieve credentials for focused tab
 * @param {object} activeInfo
 */
browser.tabs.onActivated.addListener(function(activeInfo) {
	// remove possible credentials from old tab information
	page.clearCredentials(page.currentTabId, true);
	browserAction.removeRememberPopup(null, {"id": page.currentTabId}, true);

	browser.tabs.get(activeInfo.tabId).then(function(info) {
		//console.log(info.id + ": " + info.url);
		if(info && info.id) {
			page.currentTabId = info.id;
			if(info.status == "complete") {
				//console.log("event.invoke(page.switchTab, null, "+info.id + ", []);");
				cipevent.invoke(page.switchTab, null, info.id, []);
			}
		}
	});
});

/**
 * Update browserAction on every update of the page
 * @param {integer} tabId
 * @param {object} changeInfo
 */
browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if(changeInfo.status == "complete") {
		cipevent.invoke(browserAction.removeRememberPopup, null, tabId, []);
	}
});


/**
 * Retrieve Credentials and try auto-login for HTTPAuth requests
 *
 * (Intercepting HTTP auth currently unsupported in Firefox.)
 */
if (browser.webRequest.onAuthRequired) {
	var handleReq = httpAuth.handleRequestPromise;
	var reqType = 'blocking';
	var opts = { urls: ['<all_urls>'] };

	if (utils.isFirefox) {
		handleReq = httpAuth.handleRequestCallback;
		reqType = 'asyncBlocking';
	}

	browser.webRequest.onAuthRequired.addListener(handleReq, opts, [reqType]);
	browser.webRequest.onCompleted.addListener(httpAuth.requestCompleted, opts);
	browser.webRequest.onErrorOccurred.addListener(httpAuth.requestCompleted, opts);
}

/**
 * Interaction between background-script and front-script
 */
browser.runtime.onMessage.addListener(cipevent.onMessage);

var menuContexts = ['editable'];

if (utils.isFirefox) {
	menuContexts.push('password');
}

/**
 * Add context menu entry for filling in username + password
 */
browser.contextMenus.create({
	"title": "Fill User + Pass",
	"contexts": menuContexts,
	"onclick": function(info, tab) {
		browser.tabs.sendMessage(tab.id, {
			action: "fill_user_pass"
		});
	}
});

/**
 * Add context menu entry for filling in only password which matches for given username
 */
browser.contextMenus.create({
	"title": "Fill Pass Only",
	"contexts": menuContexts,
	"onclick": function(info, tab) {
		browser.tabs.sendMessage(tab.id, {
			action: "fill_pass_only"
		});
	}
});

/**
 * Add context menu entry for creating icon for generate-password dialog
 */
browser.contextMenus.create({
	"title": "Show Password Generator Icons",
	"contexts": menuContexts,
	"onclick": function(info, tab) {
		browser.tabs.sendMessage(tab.id, {
			action: "activate_password_generator"
		});
	}
});

/**
 * Add context menu entry for creating icon for generate-password dialog
 */
browser.contextMenus.create({
	"title": "Save credentials",
	"contexts": menuContexts,
	"onclick": function(info, tab) {
		browser.tabs.sendMessage(tab.id, {
			action: "remember_credentials"
		});
	}
});

/**
 * Listen for keyboard shortcuts specified by user
 */
browser.commands.onCommand.addListener(function(command) {

	if(command === "fill-username-password") {
		browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
			if (tabs.length) {
				browser.tabs.sendMessage(tabs[0].id, { action: "fill_user_pass" });
			}
		});
	}

	if(command === "fill-password") {
		browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
			if (tabs.length) {
				browser.tabs.sendMessage(tabs[0].id, { action: "fill_pass_only" });
			}
		});
	}
});

/**
 * Interval which updates the browserAction (e.g. blinking icon)
 */
window.setInterval(function() {
	browserAction.update(_interval);
}, _interval);
