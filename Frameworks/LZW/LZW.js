// #feature Uint8Array
/* global JSLog */
'use strict';

// TODO: testing with external sources.  So far only verified that .uncompress() can properly handle
// what .compress() does, but they may each be doing the wrong thing when it comes to upping the code bit count
var LZW = {

    compress: function(input){
        var stream = new LZWStream(input);
        stream.compress();
        return stream.output;
    },

    uncompress: function(input){
        var stream = new LZWStream(input);
        stream.uncompress();
        return stream.output;
    }

};

function LZWStream(input){
    if (this === undefined){
        return new LZWStream(input);
    }
    this.bitIncreaseOffset = 0;
    this.input = input;
    this.resetTable();
}

LZWStream.prototype = {

    table: null,
    nextCode: null,
    bitLength: null,
    bitIncreaseOffset: null,
    outputLength: 0,
    byteOffset: 0,
    bitOffset: 0,

    resetTable: function(){
        this.table = {};
        this.nextCode = 258;
        this.bitLength = 9;
    },

    compress: function(){
        this.output = new Uint8Array(Math.ceil((this.input.length + 2) * 9 / 8));
        this.resetTable();
        this.bitLength = 9;
        var root = new LZWSequenceNode(null);
        var node = root;
        var x;
        var i = 0;
        var L = this.input.length;
        this.writeCode(256);
        while (i < L){
            x = this.input[i];
            if (node[x]){
                node = node[x];
            }else{
                node[x] = new LZWSequenceNode(this.nextCode++);
                this.writeCode(node.value);
                node = root;
                --i;
            }
            ++i;
            if (this.nextCode == 512 - this.bitIncreaseOffset +1){
                this.bitLength = 10;
            }else if (this.nextCode == 1024 - this.bitIncreaseOffset +1){
                this.bitLength = 11;
            }else if (this.nextCode == 2048 - this.bitIncreaseOffset +1){
                this.bitLength = 12;
            }else if (this.nextCode == 4096){
                this.resetTable();
                node = root = new LZWSequenceNode(null);
                this.writeCode(256);
            }
        }
        if (node.value !== null){
            this.writeCode(node.value);
        }
        this.writeCode(257);
        this.output = new Uint8Array(this.output.buffer, this.output.byteOffset, this.byteOffset + (this.bitOffset ? 1 : 0));
    },

    increaseOutput: function(at_least){
        var output = new Uint8Array(this.output.length * 2 + at_least);
        for (var i = 0, l = this.outputLength; i < l; ++i){
            output[i] = this.output[i];
        }
        this.output = output;
    },

    uncompress: function(){
        this.byteOffset = 0;
        this.bitOffset = 0;
        this.outputLength = 0;
        this.bitLength = 9;
        this.output = new Uint8Array(this.input.length * 5);
        var code;
        var i, l;
        var sequence = [];
        var next_sequence;
        do {
            code = this.readCode();
            if (code < 256){
                if (this.outputLength >= this.output.length){
                    this.increaseOutput(0);
                }
                this.output[this.outputLength++] = code;
                if (sequence.length > 0){
                    this.table[this.nextCode++] = sequence.concat(code);
                }
                sequence = [code];
            }else if (code == 256){
                JSLog("reset table %d".sprintf(this.nextCode));
                this.resetTable();
                sequence = [];
            }else if (code > 257){
                if (code == this.nextCode){
                    next_sequence = sequence.concat(sequence[0]);
                }else{
                    next_sequence = this.table[code];
                }
                if (next_sequence){
                    this.table[this.nextCode++] = sequence.concat(next_sequence[0]);
                    sequence = next_sequence;
                    if (this.outputLength + next_sequence.length - 1 >= this.output.length){
                        this.increaseOutput(next_sequence.length);
                    }
                    for (i = 0, l = next_sequence.length; i < l; ++i){
                        this.output[this.outputLength++] = next_sequence[i];
                    }
                }else{
                    JSLog("invalid %d after %d bits ending at %d.%d %d".sprintf(code, this.bitLength, this.byteOffset, this.bitOffset, this.nextCode));
                    break;
                    // throw new Error("LZWStream found invalid code: %d".sprintf(code));
                }
            }
            if (this.nextCode == 512 - this.bitIncreaseOffset){
                JSLog("increasing to 10 bit");
                this.bitLength = 10;
            }else if (this.nextCode == 1024 - this.bitIncreaseOffset){
                JSLog("increasing to 11 bit");
                this.bitLength = 11;
            }else if (this.nextCode == 2048 - this.bitIncreaseOffset){
                JSLog("increasing to 12 bit");
                this.bitLength = 12;
            }
        } while (code != 257);
        JSLog("ended at %d.%d".sprintf(this.byteOffset, this.bitOffset));
        this.output = new Uint8Array(this.output.buffer, this.output.byteOffset, this.outputLength);
    },

    readCode: function(){
        var code = 0;
        var x;
        var s;
        var remainingBits = this.bitLength;
        if (this.byteOffset + Math.ceil((this.bitOffset + this.bitLength - 8) / 8.0) >= this.input.length){
            throw new Error("PDFLZWFilter reading past end of input");
        }
        do {
            s = 8 - this.bitOffset;
            x = this.input[this.byteOffset];
            x = x & ((0x01 << s) - 1);
            remainingBits -= s;
            code |= (x << remainingBits);
            this.byteOffset += 1;
            this.bitOffset = 0;
        } while (remainingBits >= 8);
        if (remainingBits){
            x = this.input[this.byteOffset];
            code |= (x >> (8 - remainingBits));
            this.bitOffset = remainingBits;
        }
        return code;
    },

    writeCode: function(code){
        var remainingBits = this.bitLength;
        var x;
        var s;
        do {
            s = (remainingBits - 8 + this.bitOffset);
            x = code >> s;
            this.output[this.byteOffset] |= x;
            code = code & ((0x01 << s) - 1);
            remainingBits -= 8 - this.bitOffset;
            this.byteOffset += 1;
            this.bitOffset = 0;
        } while (remainingBits >= 8);
        if (remainingBits){
            this.output[this.byteOffset] = code << (8 - remainingBits);
            this.bitOffset = remainingBits;
        }
    }

};

var LZWSequenceNode = function(value){
    if (this === undefined){
        return new LZWSequenceNode();
    }
    this.value = value;
    if (this.value === null){
        for (var i = 0; i < 256; ++i){
            this[i] = new LZWSequenceNode(i);
        }
    }
};