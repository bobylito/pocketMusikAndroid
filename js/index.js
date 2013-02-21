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
    servUrl: "http://192.168.13.167:9000/",
    appRoot: "/pocketMusik",
    root: "/sdcard/pocketMusik",

    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        this.onDeviceReady();
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
      this.loadFiles("");
    },
    loadFiles: function (path) {
      var container = document.getElementById('files');
      container.touchEvent = {};
      container.innerHTML = "";
      console.log("load: " + path);

      if(path != ""){
        container.appendChild((function(c){
          var goUp = document.createElement("li"); 
          goUp.className    = "file";
          goUp.dataset.type = "directory";
          goUp.dataset.path = path.replace( /\/[a-zA-Z0-9]*$/, "");
          goUp.innerHTML    = "<i class='icon-chevron-left'></i> Up";
          return goUp;
        })(container));
      }

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
          li.dataset.name = file.name;
          li.dataset.fullPath = path + "/" + file.name;
          li.innerHTML = "<i class='"+icon+"'></i>"+file.name;
          container.appendChild(li);
        });
      });
      var self = this;
      container.addEventListener("touchstart", function(event){ 
        container.touchEvent[event.changedTouches[0].identifier] = event;
      }, false);
      container.addEventListener("touchend", function(event){
        if( !event || !event.changedTouches || !container.touchEvent[event.changedTouches[0].identifier] ){ 
          return; 
        }
        var target = event.target;
        var startEvent = container.touchEvent[event.changedTouches[0].identifier];
        delete container.touchEvent[event.changedTouches[0].identifier];
        var height = Math.abs(startEvent.changedTouches[0].screenY - event.changedTouches[0].screenY) 
        if( height < target.clientHeight ){
          var width = startEvent.changedTouches[0].screenX - event.changedTouches[0].screenX;
          if( Math.abs(width) < 10 && target.dataset.type == "directory" ){
            self.loadFiles(target.dataset.fullPath);
          }else if( -width > ( target.clientWidth / 2 )  ){
            if( startEvent.target.dataset.type === "file"){
              window.downloader.downloadFile({
                  fileUrl: self.servUrl + "musik" + startEvent.target.dataset.fullPath,
                  dirName: self.appRoot + startEvent.target.dataset.path
              });
            }
          }else if( width > ( target.clientWidth / 2 )  ){
            if( startEvent.target.dataset.type === "file" ){
              self.deleteFile(self.root + startEvent.target.dataset.fullPath);
            }else{
              self.deleteFolder(self.root + startEvent.target.dataset.fullPath);
            }
          }
        }
      }, false);
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
    list: function(path){
      return window.lib.xhr.get(this.servUrl + "list" + path);
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
