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
"use strict";

JSClass("JSZipTests", TKTestSuite, {

    testAddDataForFilename: function(){
        var zip = JSZip.init();
        zip.addDataForFilename("hello\n".utf8(), "test.txt", {});
        var zipData = zip.data;
        var offset = 0;
        TKAssertEquals(zipData[offset++], 0x50);
        TKAssertEquals(zipData[offset++], 0x4B);
        TKAssertEquals(zipData[offset++], 0x03);
        TKAssertEquals(zipData[offset++], 0x04);
        TKAssertEquals(zipData[offset++], 0x14);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        offset += 4; // date/time
        TKAssertEquals(zipData[offset++], 0x20);
        TKAssertEquals(zipData[offset++], 0x30);
        TKAssertEquals(zipData[offset++], 0x3A);
        TKAssertEquals(zipData[offset++], 0x36);
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x08);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData.subdataInRange(JSRange(offset, 8)).stringByDecodingUTF8(), "test.txt");
        offset += 8;
        TKAssertEquals(zipData.subdataInRange(JSRange(offset, 6)).stringByDecodingUTF8(), "hello\n");
        offset += 6;
        TKAssertEquals(zipData[offset++], 0x50);
        TKAssertEquals(zipData[offset++], 0x4B);
        TKAssertEquals(zipData[offset++], 0x01);
        TKAssertEquals(zipData[offset++], 0x02);
        TKAssertEquals(zipData[offset++], 0x14);
        TKAssertEquals(zipData[offset++], 0x03);
        TKAssertEquals(zipData[offset++], 0x14);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        offset += 4; //date/time
        TKAssertEquals(zipData[offset++], 0x20);
        TKAssertEquals(zipData[offset++], 0x30);
        TKAssertEquals(zipData[offset++], 0x3A);
        TKAssertEquals(zipData[offset++], 0x36);
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x08);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData.subdataInRange(JSRange(offset, 8)).stringByDecodingUTF8(), "test.txt");
        offset += 8;
        TKAssertEquals(zipData[offset++], 0x50);
        TKAssertEquals(zipData[offset++], 0x4B);
        TKAssertEquals(zipData[offset++], 0x05);
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x01);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x01);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x36);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x2C);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);

        zip.addDataForFilename("testing".utf8(), "two.txt", {});
        zipData = zip.data;
        offset = 0;
        TKAssertEquals(zipData[offset++], 0x50);
        TKAssertEquals(zipData[offset++], 0x4B);
        TKAssertEquals(zipData[offset++], 0x03);
        TKAssertEquals(zipData[offset++], 0x04);
        TKAssertEquals(zipData[offset++], 0x14);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        offset += 4; // date/time
        TKAssertEquals(zipData[offset++], 0x20);
        TKAssertEquals(zipData[offset++], 0x30);
        TKAssertEquals(zipData[offset++], 0x3A);
        TKAssertEquals(zipData[offset++], 0x36);
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x08);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData.subdataInRange(JSRange(offset, 8)).stringByDecodingUTF8(), "test.txt");
        offset += 8;
        TKAssertEquals(zipData.subdataInRange(JSRange(offset, 6)).stringByDecodingUTF8(), "hello\n");
        offset += 6;
        TKAssertEquals(zipData[offset++], 0x50);
        TKAssertEquals(zipData[offset++], 0x4B);
        TKAssertEquals(zipData[offset++], 0x03);
        TKAssertEquals(zipData[offset++], 0x04);
        TKAssertEquals(zipData[offset++], 0x14);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        offset += 4; // date/time
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x5A);
        TKAssertEquals(zipData[offset++], 0xF3);
        TKAssertEquals(zipData[offset++], 0xE8);
        TKAssertEquals(zipData[offset++], 0x07);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x07);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x07);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData.subdataInRange(JSRange(offset, 7)).stringByDecodingUTF8(), "two.txt");
        offset += 7;
        TKAssertEquals(zipData.subdataInRange(JSRange(offset, 7)).stringByDecodingUTF8(), "testing");
        offset += 7;
        TKAssertEquals(zipData[offset++], 0x50);
        TKAssertEquals(zipData[offset++], 0x4B);
        TKAssertEquals(zipData[offset++], 0x01);
        TKAssertEquals(zipData[offset++], 0x02);
        TKAssertEquals(zipData[offset++], 0x14);
        TKAssertEquals(zipData[offset++], 0x03);
        TKAssertEquals(zipData[offset++], 0x14);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        offset += 4; //date/time
        TKAssertEquals(zipData[offset++], 0x20);
        TKAssertEquals(zipData[offset++], 0x30);
        TKAssertEquals(zipData[offset++], 0x3A);
        TKAssertEquals(zipData[offset++], 0x36);
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x08);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData.subdataInRange(JSRange(offset, 8)).stringByDecodingUTF8(), "test.txt");
        offset += 8;
        TKAssertEquals(zipData[offset++], 0x50);
        TKAssertEquals(zipData[offset++], 0x4B);
        TKAssertEquals(zipData[offset++], 0x01);
        TKAssertEquals(zipData[offset++], 0x02);
        TKAssertEquals(zipData[offset++], 0x14);
        TKAssertEquals(zipData[offset++], 0x03);
        TKAssertEquals(zipData[offset++], 0x14);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        offset += 4; //date/time
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x5A);
        TKAssertEquals(zipData[offset++], 0xF3);
        TKAssertEquals(zipData[offset++], 0xE8);
        TKAssertEquals(zipData[offset++], 0x07);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x07);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x07);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x2C);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData.subdataInRange(JSRange(offset, 7)).stringByDecodingUTF8(), "two.txt");
        offset += 7;
        TKAssertEquals(zipData[offset++], 0x50);
        TKAssertEquals(zipData[offset++], 0x4B);
        TKAssertEquals(zipData[offset++], 0x05);
        TKAssertEquals(zipData[offset++], 0x06);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x02);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x02);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x6B);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x58);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
        TKAssertEquals(zipData[offset++], 0x00);
    },

    testSingleTextFile: function(){
        var zip = JSZip.init();
        var data = "hello\n".utf8();
        var file = JSFile.initWithData(data, "test.txt", JSMediaType("text/plain"));
        var expectation = TKExpectation.init();
        expectation.call(zip.addFile, zip, file, function(error){
            TKAssertNull(error);
            var zipData = zip.data;
            var offset = 0;
            TKAssertEquals(zipData[offset++], 0x50);
            TKAssertEquals(zipData[offset++], 0x4B);
            TKAssertEquals(zipData[offset++], 0x03);
            TKAssertEquals(zipData[offset++], 0x04);
            TKAssertEquals(zipData[offset++], 0x14);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            offset += 4; // date/time
            TKAssertEquals(zipData[offset++], 0x20);
            TKAssertEquals(zipData[offset++], 0x30);
            TKAssertEquals(zipData[offset++], 0x3A);
            TKAssertEquals(zipData[offset++], 0x36);
            TKAssertEquals(zipData[offset++], 0x06);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x06);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x08);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData.subdataInRange(JSRange(offset, 8)).stringByDecodingUTF8(), "test.txt");
            offset += 8;
            TKAssertEquals(zipData.subdataInRange(JSRange(offset, 6)).stringByDecodingUTF8(), "hello\n");
            offset += 6;
            TKAssertEquals(zipData[offset++], 0x50);
            TKAssertEquals(zipData[offset++], 0x4B);
            TKAssertEquals(zipData[offset++], 0x01);
            TKAssertEquals(zipData[offset++], 0x02);
            TKAssertEquals(zipData[offset++], 0x14);
            TKAssertEquals(zipData[offset++], 0x03);
            TKAssertEquals(zipData[offset++], 0x14);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            offset += 4; //date/time
            TKAssertEquals(zipData[offset++], 0x20);
            TKAssertEquals(zipData[offset++], 0x30);
            TKAssertEquals(zipData[offset++], 0x3A);
            TKAssertEquals(zipData[offset++], 0x36);
            TKAssertEquals(zipData[offset++], 0x06);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x06);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x08);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData.subdataInRange(JSRange(offset, 8)).stringByDecodingUTF8(), "test.txt");
            offset += 8;
            TKAssertEquals(zipData[offset++], 0x50);
            TKAssertEquals(zipData[offset++], 0x4B);
            TKAssertEquals(zipData[offset++], 0x05);
            TKAssertEquals(zipData[offset++], 0x06);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x01);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x01);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x36);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x2C);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
            TKAssertEquals(zipData[offset++], 0x00);
        });
        this.wait(expectation, 2.0);
    }

});