// #import "PDFKit/PDFFilter.js"
// #import "PDFKit/PDFTokenizer.js"
/* global JSClass, PDFFilter, JSData, PDFTokenizer */
'use strict';

JSClass("PDFASCIIHexFilter", PDFFilter, {

    maximumLineLength: 78,

    decode: function(data){
        var output = JSData.initWithLength(Math.ceil(data.length / 2));
        var pair = [0, 0];
        var slot = 0;
        var h;
        var o = 0;
        var i = 0;
        var l = data.length;
        var foundEnd = false;
        while (i < l){
            h = data.bytes[i];
            if (PDFTokenizer.Hexadecimal.isHexadecimal(h)){
                pair[slot++] = h;
                if (slot == 2){
                    output.bytes[o++] = parseInt(String.fromCharCode(pair[0], pair[1]), 16);
                    slot = 0;
                }
            }else if (h === 0x3E){
                foundEnd = true;
                if (slot == 1){
                    output.bytes[o++] = parseInt(String.fromCharCode(pair[0]) + '0', 16);
                }
                break;
            }else if (!PDFTokenizer.Whitespace.isWhitespace(h)){
                throw new Error("PDFASCIIHexFilter found invalid byte %#02x at index %d".sprintf(h, i));
            }
            ++i;
        }
        if (!foundEnd){
            throw new Error("PDFASCIIHexFilter reached end of data without > marker");
        }
        output.truncateToLength(o);
        return output;
    },

    encode: function(data){
        var outputLength = data.length * 2;
        var newlineCount = Math.floor(outputLength / this.maximumLineLength);
        outputLength += newlineCount;
        outputLength += 1; // for EOD
        var output = JSData.initWithLength(outputLength);
        var c;
        var h;
        var o = 0;
        var lineLength = 0;
        for (var i = 0, l = data.length; i < l; ++i){
            c = data.bytes[i];
            h = (c < 16 ? '0': '') + c.toString(16).toUpperCase();
            output.bytes[o++] = h.charCodeAt(0);
            ++lineLength;
            if (lineLength == this.maximumLineLength){
                lineLength = 0;
                output.bytes[o++] = 0x0a;
            }
            output.bytes[o++] = h.charCodeAt(1);
            ++lineLength;
            if (lineLength == this.maximumLineLength){
                lineLength = 0;
                output.bytes[o++] = 0x0a;
            }
        }
        output.bytes[o] = 0x3E;
        return output;
    }
});