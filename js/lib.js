window.lib = (function(win){
  var xhr = {
    get: function(url){
      var defer   = Q.defer(),
          request = new XMLHttpRequest();
      request.open('GET', url, false);
      request.onload = function( event ) {
        defer.resolve(request);
      };

      request.send();
      return defer.promise;
    }
  };

  return {xhr:xhr};
})(window)
