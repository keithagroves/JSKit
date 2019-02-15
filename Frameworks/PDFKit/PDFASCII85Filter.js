// #import "PDFKit/PDFFilter.js"
/* global JSClass, PDFFilter, JSData, PDFASCII85Filter, PDFReader */
'use strict';

JSClass("PDFASCII85Filter", PDFFilter, {

    maximumLineLength: 78,

    decode: function(data){
        var output = JSData.initWithLength(data.length * 5);
        var quintet = [117, 117, 117, 117, 117];
        var slot = 0;
        var q;
        var i = 0;
        var l = data.length;
        var x;
        var o = 0;
        var expectingEnd = false;
        var foundEnd = false;
        while (i < l){
            x = data.bytes[i];
            if (expectingEnd){
                if (!PDFReader.Whitespace.isWhitespace(x)){
                    if (x == 0x3E){
                        expectingEnd = false;
                        foundEnd = true;
                        if (slot > 0){
                            q = PDFASCII85Filter.decodeQuintet.apply(undefined, quintet);
                            for (var j = 0; j < slot - 1; ++j){
                                output.bytes[o++] = q[j];
                            }
                        }
                        break;
                    }else{
                        throw new Error("PDFASCII85Filter found invalid byte %#02x at index %d".sprintf(x, i));
                    }
                }
            }else{
                if (x >= 0x21 && x <= 0x75){
                    quintet[slot++] = x;
                    if (slot == 5){
                        q = PDFASCII85Filter.decodeQuintet.apply(undefined, quintet);
                        output.bytes[o++] = q[0];
                        output.bytes[o++] = q[1];
                        output.bytes[o++] = q[2];
                        output.bytes[o++] = q[3];
                        quintet = [117, 117, 117, 117, 117];
                        slot = 0;
                    }
                }else if (x == 0x7A){
                    output.bytes[o++] = 0;
                    output.bytes[o++] = 0;
                    output.bytes[o++] = 0;
                    output.bytes[o++] = 0;
                }else if (x == 0x7E){
                    expectingEnd = true;
                }else if (!PDFReader.Whitespace.isWhitespace(x)){
                    throw new Error("PDFASCII85Filter found invalid byte %#02x at index %d".sprintf(x, i));
                }
            }
            ++i;
        }
        if (!foundEnd){
            throw new Error("PDFASCII85Filter reached end of data without ~> marker");
        }
        output.truncateToLength(o);
        return output;
    },

    encode: function(data){
        var outputLength = Math.ceil(data.length / 4) * 5;
        var numberOfLines = Math.floor((outputLength + 1) / this.maximumLineLength);
        outputLength += numberOfLines;
        outputLength += 2;
        var output = JSData.initWithLength(outputLength);
        var o = 0;
        var a, b, c, d;
        var q;
        var tail = data.length % 4;
        var i, l;
        var lineLength = 0;
        for (i = 0, l = data.length - tail; i < l; i += 4){
            a = data.bytes[i];
            b = data.bytes[i + 1];
            c = data.bytes[i + 2];
            d = data.bytes[i + 3];
            q = PDFASCII85Filter.encodeQuartet(a, b, c, d);
            if (q[0] === 0 && q[1] === 0 && q[2] === 0 && q[3] === 0 && q[4] === 0){
                output.bytes[o] = 0x7A;
                o += 1;
            }else{
                output.bytes[o++] = q[0];
                ++lineLength;
                if (lineLength == this.maximumLineLength){
                    output.bytes[o++] = 0x0a;
                    lineLength = 0;
                }
                output.bytes[o++] = q[1];
                ++lineLength;
                if (lineLength == this.maximumLineLength){
                    output.bytes[o++] = 0x0a;
                    lineLength = 0;
                }
                output.bytes[o++] = q[2];
                ++lineLength;
                if (lineLength == this.maximumLineLength){
                    output.bytes[o++] = 0x0a;
                    lineLength = 0;
                }
                output.bytes[o++] = q[3];
                ++lineLength;
                if (lineLength == this.maximumLineLength){
                    output.bytes[o++] = 0x0a;
                    lineLength = 0;
                }
                output.bytes[o++] = q[4];
                ++lineLength;
                if (lineLength == this.maximumLineLength){
                    output.bytes[o++] = 0x0a;
                    lineLength = 0;
                }
            }
        }
        if (tail){
            var quartet = [0, 0, 0, 0];
            for (i = 0; i < tail; ++i){
                quartet[i] = data.bytes[data.length - tail + i];
            }
            q = PDFASCII85Filter.encodeQuartet.apply(undefined, quartet);
            for (i = 0; i <= tail; ++i){
                output.bytes[o++] = q[i];
                ++lineLength;
                if (lineLength == this.maximumLineLength){
                    output.bytes[o++] = 0x0a;
                    lineLength = 0;
                }
            }
        }
        output.bytes[o++] = 0x7E;
        ++lineLength;
        if (lineLength == this.maximumLineLength){
            output.bytes[o++] = 0x0a;
            lineLength = 0;
        }
        output.bytes[o++] = 0x3E;
        output.truncateToLength(o);
        return output;
    }
});

PDFASCII85Filter.encodeQuartet = function(a, b, c, d){
    var n = new Uint32Array(1);
    var q = new Uint8Array(5);
    var x;
    n[0] = (a << 24) | (b << 16) | (c << 8) | d;
    for (var i = 4; i >= 0; --i){
        x = n[0] % 85;
        q[i] = x + 33;
        n[0] -= x;
        n[0] /= 85;
    }
    return q;
};

PDFASCII85Filter.decodeQuintet = function(a, b, c, d, e){
    var n = new Uint32Array(1);
    var q = new Uint8Array(4);
    var p85 = PDFASCII85Filter.PowerOf85;
    n[0] = (a - 33) * p85[4] + (b - 33)* p85[3] + (c - 33) * p85[2] + (d - 33) * p85[1] + (e - 33);
    q[0] = (n[0] >> 24) & 0xFF;
    q[1] = (n[0] >> 16) & 0xFF;
    q[2] = (n[0] >> 8) & 0xFF;
    q[3] = n[0] & 0xFF;
    return q;
};

PDFASCII85Filter.PowerOf85 = {
    0: 1,
    1: 85,
    2: 85 * 85,
    3: 85 * 85 * 85,
    4: 85 * 85 * 85 * 85
};