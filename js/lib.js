window.lib = (function(win){
  var xhr = {
    get: function(url){
      console.log("xhr[GET] : "+url)
      try{
        var defer   = Q.defer(),
            request = new XMLHttpRequest();
            timeout = setTimeout(function(){
              request.abort();
              defer.reject(new Error("Timeout"));
            }, 10000);
        request.open('GET', url, true);
        request.onload = function() {
          clearTimeout(timeout);
          defer.resolve(request);
        };

        request.send();
      } catch(e){
        defer.reject(e);
      }
      return defer.promise;
    }
  },
  store = {
    set : function(key, value){
      localStorage.setItem(key, value);
    },
    get : function(key){
      return localStorage.getItem(key);      
    },
    remove : function(key){
      localStorage.removeItem(key);
    }
  };

  return {
    xhr:xhr,
    store:store
  };
})(window)
