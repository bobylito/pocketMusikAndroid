window.lib = (function(win){
  var xhr = {
    get: function(url){
      try{
        var defer   = Q.defer(),
            request = new XMLHttpRequest();
            timeout = setTimeout(function(){
              request.abort();
              defer.reject(new Error("Timeout"));
            }, 1000);
        request.open('GET', url, true);
        request.onload = function( event ) {
          clearTimeout(timeout);
          defer.resolve(request);
        };
        request.onerror = function(e){
          defer.reject(e);
        };

        request.send();
      } catch(e){
        defer.reject(e);
      }
      return defer.promise;
    }
  };

  return {xhr:xhr};
})(window)
