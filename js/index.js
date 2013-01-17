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
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        //document.addEventListener('deviceready', this.onDeviceReady, false);
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
      container.innerHTML = "";
      console.log("load: " + path);
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
          var li = document.createElement("li");
          li.className = "file";
          li.dataset.type = file.isDirectory ? "directory" : "file";
          li.dataset.path = path + "/" + file.name;
          li.textContent = file.name;
          container.appendChild(li);
        });
      });
      var self = this;
      container.onclick = function (event) {
        var target = event.target;
        if (target.dataset.type == "directory") {
          self.loadFiles(target.dataset.path);
        }
      };
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
      return window.lib.xhr.get("http://192.168.0.16:9000/list" + path);
    }
};
