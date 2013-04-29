function Downloader() {}

Downloader.prototype.downloadFile = function(params, win, fail) {
  if (!win) win = function(){};
  if (!fail) fail = function(){};
 
  if(cordova && cordova.exec){ 
    cordova.exec(win, fail, "Downloader", "downloadFile", [params]);
  }
  else {
    window.open(params.fileUrl);
  }
};

window.downloader = new Downloader();
