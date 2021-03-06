/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    servUrl: function(){
        var ip   = window.lib.store.get("config.ip"),
            port = window.lib.store.get("config.port");
        return "http://"+ (ip) +":"+ (port?port:9000) +"/"
    },
    appRoot: "/pocketMusik",
    root: "/sdcard/pocketMusik",

    // Application Constructor
    initialize: function() {
      this.bindEvents();
      this.hideScreens();
      this.loading(false);
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
      var readyEvt = window["Cordova"] ? "deviceready" : "DOMContentLoaded";
      document.addEventListener(readyEvt, app.onDeviceReady, false);
    },

    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
      console.log("device ready!");
      var ip   = window.lib.store.get("config.ip"),
          port = window.lib.store.get("config.port");
      if( ip === null && port === null){
        app.showConfigScreen();
      }
      else {
        app.loadFiles( "");
      }
    },

    hideScreens : function(){
      console.log("Nothing to see");
      var screens = document.querySelectorAll( ".screen" );
      Array.prototype.forEach.call( screens, function( s ){
        s.style.opacity = "0";
        s.style.display = "none";
      });                   
    },

    showScreen: function( elt ){
        elt.style.opacity = "1";
        elt.style.display = "block";
    },

    showConfigScreen : function(){
      var self          = this,
          configScreen  = document.querySelector("#config"),
          okButton      = configScreen.querySelector("button");
      this.hideScreens();
      app.showScreen(configScreen);
      okButton.addEventListener("click", function(){
        var address = configScreen.querySelector("#address").value,
            port    = configScreen.querySelector("#port").value;
        console.log("new configuration : " + address + ":" + port);
        window.lib.store.set("config.ip",  address),
        window.lib.store.set("config.port",port);
        self.loadFiles("");
      }, false);
    },

    loading:function(isLoading){
      var spinner = document.querySelector(".loader");
      if(isLoading)
        spinner.style.visibility = "visible";
      else 
        spinner.style.visibility = "hidden";
    },

    loadFiles: function (path) {
      var mainScreen  = document.getElementById("main"),
          container   = document.getElementById('files'),
          self        = this;

      this.hideScreens();
      app.showScreen(mainScreen);

      container.touchEvent = {};
      container.innerHTML = "";
      console.log("load: " + path);

      if(path){
        container.appendChild((function(c){
          var goUp = document.createElement("li"); 
          goUp.className    = "file";
          goUp.dataset.type = "directory";
          goUp.dataset.path = path.replace( /\/[a-zA-Z0-9]*$/, "");
          goUp.innerHTML    = "<i class='icon-chevron-left'></i> Up";
          return goUp;
        })(container));
      }

      this.loading(true);
      app.list(path).then(function(xhr){
        console.log(xhr.responseText);
        var files = JSON.parse(xhr.responseText);
        files.sort(function (f1, f2) {
          if (f1.isDirectory && f2.isDirectory)
            return f1.name.toLowerCase() > f2.name.toLowerCase() ? 1 : -1;
          else if (f1.isDirectory && !f2.isDirectory)
            return -1;
          else if (!f1.isDirectory && f2.isDirectory)
            return 1;
          else
            return f1.name.toLowerCase() > f2.name.toLowerCase() ? 1 : -1;
        }).forEach(function (file) {
          var li = document.createElement("li"),
              type = file.isDirectory ? "directory" : "file",
              icon = file.isDirectory ? "icon-folder-close": "icon-file";

          li.className = "file";
          li.dataset.type = type;
          li.dataset.path = path;
          li.dataset.isDirectory = file.isDirectory;
          li.dataset.name = file.name;
          li.dataset.fullPath = path + "/" + file.name;
          li.innerHTML = "<i class='"+icon+"'></i>"+file.name;
          container.appendChild(li);

          try{
            self.checkFile(li, self.root + li.dataset.fullPath, file.isDirectory);
          }
          catch(e){
            //Meehh
          }
        });
      }, function( err ){
        console.log("bad request : maybe bad config" + err.toString());
        window.lib.store.remove("config.ip"),
        window.lib.store.remove("config.port");
        return self.showConfigScreen();
      }).fin(function(){
        self.loading(false);
      }).done();

      container.addEventListener("touchstart", function(event) {
        container.touchEvent[event.changedTouches[0].identifier] = event;
        event.target.style.backgroundColor = "rgb(255, 255, 255)";
      }, false);

      container.addEventListener("touchmove", function(event) {
        var touch = event.changedTouches[0];
        var startEvent = container.touchEvent[touch.identifier];
        var height = Math.abs(startEvent.changedTouches[0].screenY - touch.screenY);
        var target = event.target;
        if ( height < target.clientHeight ) {
          var width = touch.screenX - startEvent.changedTouches[0].screenX;
          if (width > 10) {
            var c = 255 - Math.round(Math.min(width / ( target.clientWidth / 2 ), 1) * 255);
            event.target.style.backgroundColor = "rgb("+c+", "+c+", 255)";
          } else if (width < -10) {
            var c = 255 - Math.round(Math.min(-width / ( target.clientWidth / 2 ), 1) * 255);
            event.target.style.backgroundColor = "rgb(255, "+c+", "+c+")";
          }
        }
        else {
          event.target.style.backgroundColor = "";
        }
      }, false);

      container.addEventListener("touchend", function(event){
        var touch = event.changedTouches[0];
        if( !event || !event.changedTouches || !container.touchEvent[touch.identifier] ){ 
          return; 
        }
        var target = event.target;
        var startEvent = container.touchEvent[touch.identifier];
        delete container.touchEvent[touch.identifier];
        var height = Math.abs(startEvent.changedTouches[0].screenY - touch.screenY) 
        if ( height < target.clientHeight ) {
          var width = startEvent.changedTouches[0].screenX - touch.screenX;
          if ( Math.abs(width) < 10 ) {
            self.tap(target);
          } else if( -width > ( target.clientWidth / 2 )  ) {
            self.swipeRight(target);
          } else if( width > ( target.clientWidth / 2 )  ) {
            self.swipeLeft(target);
          }
        }
        event.target.style.backgroundColor = "";
      }, false);
    },

    tap: function(target) {
      if (target.dataset.type == "directory")
        this.loadFiles(target.dataset.fullPath);
    },

    swipeLeft: function (target) {
      var isFolder = target.dataset.type !== "file";
      this.changeIcon(target, isFolder, false);
      if ( !isFolder ) {
        this.deleteFile(this.root + target.dataset.fullPath);
      } else {
        this.deleteFolder(this.root + target.dataset.fullPath);
      }
    },

    swipeRight: function (target) {
      var data = target.dataset;
      if ( data.type === "file") {
        this.changeIcon(target, false, true);
      }
      app.download(data.path, data.name, data.isDirectory==="true");
    },

    download: function( path, name, isDirectory){
      if( isDirectory ){ 
        return app
          .list( "/" + path + "/" + name )
          .then( function( xhr ){ return xhr.response; })
          .then( JSON.parse)
          .then( function(list){
            return Q.allResolved(list.map(function(file){
              return app.download(file.path, file.name, file.isDirectory);      
            }));
          }).fail(function(err){
            console.log("APP : 246 > " + err);
          });
      }
      else {
        return window.downloader.downloadFile({
          fileUrl: this.servUrl() + "musik/" + path + "/" + name,
          dirName: this.appRoot + path
        }).fail(function(errArgs){
          console.log(file.name + file.path);
          console.log("err: "+ errArgs);
        });
      } 
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },

    // Retrieve directory list
    list: function( path){
      return window.lib.xhr.get( this.servUrl() + "list" + path);
    },

    changeIcon: function(element, isDirectory, downloaded){
      var icon = element.querySelector("i");
      
      var toRemove = ( isDirectory 
        ? ( downloaded ? "icon-folder-close" : "icon-folder-open" )
        : ( downloaded ? "icon-file" : "icon-save" )
      );

      var toAdd = ( isDirectory 
        ? ( downloaded ? "icon-folder-open" : "icon-folder-close" )
        : ( downloaded ? "icon-save" : "icon-file" )
      );

      icon.classList.remove(toRemove);
      icon.classList.add(toAdd);
    },

    checkFile: function(element, path, isDirectory){
      var self = this;
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
          var error = function(){};

          if( isDirectory ){
            fs.root.getDirectory( path, {create: false, exclusive: false}, 
              function(directoryEntry){
                directoryEntry.remove(error, function(){ self.changeIcon(element, isDirectory, true); } );
              }, error);
          }else{
            fs.root.getFile( path, {create: false, exclusive: false},
              function(){ self.changeIcon(element, isDirectory, true); }, error);
          }
        }, function(error) { console.log("Failed to get fs, error code :" + error.code); }
      );
    },

    deleteFile: function(path){
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
          fs.root.getFile( path, {create: false, exclusive: false}, 
            function(fileEntry){
              fileEntry.remove( 
                function(entry) { console.log("Remove complete: " + path); },
                function(error) { console.log("Remove failed, error code : " + error.code); }
              );
            }, 
            function(error) { console.log("Failed to load fileEntry, error code :" + error.code); }
          );
        }, function(error) { console.log("Failed to get fs, error code :" + error.code); }
      );
    },

    deleteFolder: function(path){
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
          fs.root.getDirectory( path, {create: false, exclusive: false}, 
            function(directoryEntry){
              directoryEntry.removeRecursively( 
                function(entry) { console.log("Remove complete: " + path); },
                function(error) { console.log("Remove failed, error code : " + error.code); }
              );
            }, 
            function(error) { console.log("Failed to load directoryEntry, error code :" + error.code); }
          );
        }, function(error) { console.log("Failed to get fs, error code :" + error.code); }
      );
    }
};
