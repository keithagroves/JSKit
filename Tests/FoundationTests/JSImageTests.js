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

// #import Foundation
// #import TestKit
'use strict';

JSClass("JSImageTests", TKTestSuite, {

    testResourceData: function(){
        var image = JSImage.initWithResourceName('test');
        TKAssertNotNull(image);

        var expectation = TKExpectation.init();
        expectation.call(image.getData, image, function(data){
            TKAssertNotNull(data);
            TKAssertObjectEquals(data, [0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x02,0x00,0x00,0x00,0x02,0x08,0x02,0x00,0x00,0x00,0xFD,0xD4,0x9A,0x73,0x00,0x00,0x00,0x01,0x73,0x52,0x47,0x42,0x00,0xAE,0xCE,0x1C,0xE9,0x00,0x00,0x00,0x15,0x49,0x44,0x41,0x54,0x08,0x1D,0x63,0xF8,0xCF,0xC0,0xC0,0xF0,0x9F,0x81,0x11,0x48,0xFC,0xFF,0xCF,0x00,0x00,0x1E,0xF6,0x04,0xFD,0xA0,0x06,0x5A,0x06,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82]);
        });

        this.wait(expectation, 2.0);
    }

});