// Copyright 2021 Breakside Inc.
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

// #import "CSSOMBase.js"
"use strict";

CSSOM.CSSStyleDeclaration.prototype = Object.create(CSSOM.StyleSheet, {
    
    constructor: {
        value: CSSOM.CSSStyleDeclaration
    },

    cssText: {
        get: function(){
            var lines = [];
        }
    },

    _properties: {configurable: true, value: null},

    length: {
        get: function CSSStyleDeclaration_getLength(){
            return this._properties.length;
        }
    },

    item: {
        value: function CSSStyleDeclaration_item(index){
            return this._properties[index].name;
        }
    },

    getPropertyValue: {
        value: function CSSStyleDeclaration_getPropertyValue(name){
            return this._properties[index].value;
        }
    }

});