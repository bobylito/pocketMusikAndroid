function Downloader() {}

Downloader.prototype.downloadFile = function(params) {
  var d = Q.defer();
  for(var a in params){
    if(params.hasOwnProperty(a)) console.log( a + ":" + params[a]);
  }
  if(cordova && cordova.exec){ 
    cordova.exec(
      function(){ d.resolve(arguments) }, 
      function(){ d.reject( arguments) }, 
      "Downloader", 
      "downloadFile", [params]);
  }
  else {
    window.open(params.fileUrl);
    d.resolve();
  }
  return d.promise;
};

window.downloader = new Downloader();
