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
    servUrl: function(ip, port){
        return "http://"+ (ip?ip:"192.168.0.1") +":"+ (port?port:9000) +"/"
    },
    appRoot: "/pocketMusik",
    root: "/sdcard/pocketMusik",

    // Application Constructor
    initialize: function() {
        console.log("oui");
        this.bindEvents();
        this.hideScreens();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
    },

    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
      console.log("device ready!");
      app.loadFiles( "192.168.0.12", "9000", "");
    },

    hideScreens : function(){
      console.log("Nothing to see");
      var screens = document.querySelectorAll( ".screen" );
      Array.prototype.forEach.call( screens, function( s ){
        s.style.opacity = "0";
      });                   
    },

    showConfigScreen : function(){
      var self          = this,
          configScreen  = document.querySelector("#config"),
          okButton      = configScreen.querySelector("button");
      this.hideScreens();
      configScreen.style.opacity = 1;
      okButton.addEventListener("click", function(){
        var address = configScreen.querySelector("#address").value,
            port    = configScreen.querySelector("#port").value;
        console.log("new configuration : " + address + ":" + port);
        self.ip   = address;
        self.port = port;
        self.loadFiles(address, port, "");
      }, false);
    },

    loading:function(isLoading){
      var spinner = document.querySelector(".loader");
      if(isLoading)
        spinner.style.visibility = "visible";
      else 
        spinner.style.visibility = "hidden";
    },

    loadFiles: function (ip, port, path) {
      var mainScreen  = document.getElementById("main"),
          container   = document.getElementById('files'),
          self        = this;

      this.hideScreens();
      mainScreen.style.opacity = "1";

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
      app.list(ip, port, path).then(function(xhr){
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
          li.dataset.name = file.name;
          li.dataset.fullPath = path + "/" + file.name;
          li.innerHTML = "<i class='"+icon+"'></i>"+file.name;
          container.appendChild(li);
        });
      }, function( err ){
        console.log("bad request : maybe bad config" + err.toString());
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
            self.tap(target, self.ip, self.port);
          } else if( -width > ( target.clientWidth / 2 )  ) {
            self.swipeRight(target, self.ip, self.port);
          } else if( width > ( target.clientWidth / 2 )  ) {
            self.swipeLeft(target);
          }
        }
        event.target.style.backgroundColor = "";
      }, false);
    },

    tap: function(target, ip, port) {
      if (target.dataset.type == "directory")
        this.loadFiles(ip, port, target.dataset.fullPath);
    },

    swipeLeft: function (target) {
      if ( target.dataset.type === "file" ) {
        this.deleteFile(this.root + target.dataset.fullPath);
      } else {
        this.deleteFolder(this.root + target.dataset.fullPath);
      }
    },

    swipeRight: function (target, ip, port) {
      if ( target.dataset.type === "file") {
        window.downloader.downloadFile({
          fileUrl: this.servUrl(ip, port) + "musik" + target.dataset.fullPath,
          dirName: this.appRoot + target.dataset.path
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
    list: function(ip, port, path){
      return window.lib.xhr.get( this.servUrl(ip, port) + "list" + path);
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
