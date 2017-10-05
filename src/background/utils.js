
var utils = {};

utils.isFirefox = false;

if (!(/Chrome/.test(navigator.userAgent) && /Google/.test(navigator.vendor))) {
	utils.isFirefox = true;
}
