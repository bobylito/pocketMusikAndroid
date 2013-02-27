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
        console.log("oui oui");
        document.addEventListener('deviceready', app.onDeviceReady, false);
        //this.onDeviceReady();
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
      console.log(configScreen)
      configScreen.style.opacity = 1;
      okButton.addEventListener("click", function(){
        var address = configScreen.querySelector("#address"),
            port    = configScreen.querySelector("#port");
        console.log(address, port);
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

    loadFiles: function (adress, port, path) {
      var mainScreen  = document.getElementById("main"),
          container   = document.getElementById('files'),
          self        = this;

      this.hideScreens();
      mainScreen.style.opacity = "1";

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

      this.loading(true);
      app.list(address, port, path).then(function(xhr){
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
          li.dataset.path = path + "/" + file.name;
          li.innerHTML = "<i class='"+icon+"'></i>"+file.name;
          container.appendChild(li);
        });
      }, function( err ){
        console.log("bad request : maybe bad config");
        return self.showConfigScreen();
      }).fin(function(){
        self.loading(false);
      }).done();

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
            self.loadFiles( address, port, target.dataset.path);
          }else if( -width > ( target.clientWidth / 2 )  ){
            console.log("Right swipe on : " + startEvent.target.textContent)
          }else if( width > ( target.clientWidth / 2 )  ){
            console.log("Left swipe on : " + startEvent.target.textContent)
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
    list: function(adress, port, path){
      var self = this;
      return window.lib.xhr.get("http://10.0.24.74:9000/list" + path);
    }
};
