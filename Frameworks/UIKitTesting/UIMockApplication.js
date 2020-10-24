// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import UIKit
// #import "UIMockWindowServer.js"
"use strict";

JSClass("UIMockApplication", UIApplication, {

    init: function(){
        var bundle = JSBundle.initWithDictionary({Info: {}});
        var windowServer = UIMockWindowServer.init();
        UIMockApplication.$super.initWithBundle.call(this, bundle, windowServer);
        JSFont.registerDummySystemFont();
    },

    mockStart: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNull);
        }
        JSFileManager.shared.open(function(state){
            switch (state){
                case JSFileManager.State.success:
                    JSUserDefaults.shared.open(function(){
                        completion.call(target, null);
                    }, this);
                    break;
                case JSFileManager.State.genericFailure:
                    completion.call(target, JSFileManager.shared.error || new Error("Failed to open filesystem"));
                    break;
                case JSFileManager.State.conflictingVersions:
                    completion.call(target, new Error("JSKIT_CLOSE_OTHER_INSTANCES"));
            }
        }, this);
        return completion.promise;
    },

    mockStop: function(completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNull);
        }
        this.deinit();
        JSFileManager.shared.destroy(function(){
            completion.call(target, null); 
        });
        return completion.promise;
    },

    deinit: function(){
        JSFont.unregisterDummySystemFont();
        UIMockApplication.$super.deinit.call(this);
    }

});