function Downloader() {}

Downloader.prototype.downloadFile = function(params, win, fail) {
	if (!win) win = function(){};
	if (!fail) fail = function(){};
	
	cordova.exec(win, fail, "Downloader", "downloadFile", [params]);
};

window.downloader = new Downloader();