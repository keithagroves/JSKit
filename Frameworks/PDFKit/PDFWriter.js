// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFTypes.js"
/* global JSClass, JSReadOnlyProperty, JSObject, PDFDocumentObject, PDFStream, PDFNameObject, PDFIndirectObject, PDFObject, PDFWriter, PDFTrailerObject */
'use strict';

(function(){

JSClass("PDFWriter", JSObject, {

    version: "1.7",
    stream: JSReadOnlyProperty('_stream', null),
    _crossReferenceTable: null,
    _crossReferenceOffset: 0,
    _offset: 0,
    _trailer: null,

    initWithStream: function(stream){
        this._stream = stream;
        this._write("%%PDF-%s\n", this.version);
        this._crossReferenceTable = [
            CrossReferenceTableEntry(0, 65535, CrossReferenceTableEntry.Status.free)
        ];
        this._trailer = PDFTrailerObject();
    },

    format: function(message){
        return message.format(pdf_formatter, Array.prototype.slice.call(arguments, 1));
    },

    indirect: function(){
        var obj;
        for (var i = 0, l = arguments.length; i < l; ++i){
            obj = arguments[i];
            if (!obj.indirect){
                obj.indirect = this.createIndirect();
            }
        }
    },

    createIndirect: function(){
        var entry = CrossReferenceTableEntry(null, 0);
        this._crossReferenceTable.push(entry);
        return PDFIndirectObject(this._crossReferenceTable.length - 1, entry.generation);
    },

    beginStreamObject: function(extent){
        this._writeObjectOpening(extent);
        this._writeObject(extent);
        this._write("\nstream\n");
    },

    writeStreamData: function(data){
        this._write(data);
    },

    endStreamObject: function(extent){
        this._write("\nendstream\nendobj\n");
    },

    writeObject: function(obj){
        this._writeObjectOpening(obj);
        this._writeObject(obj);
        this._write("\nendobj\n");
        if (obj instanceof PDFDocumentObject){
            this._trailer.Root = obj.indirect;
        }
    },

    _writeObjectOpening: function(obj){
        var indirect = null;
        if ((obj instanceof PDFObject)){
            if (!obj.indirect){
                this.indirect(obj);
            }
            indirect = obj.indirect;
        }else if (obj instanceof PDFIndirectObject){
            indirect = obj;
        }else{
            indirect = this.createIndirect();
        }
        this._crossReferenceTable[indirect.objectID].offset = this._offset;
        this._write("%d %d obj\n", indirect.objectID, indirect.generation);
    },

    close: function(callback){
        this._writeCrossReferenceTable();
        this._writeTrailer();
        this._stream.close(callback);
    },

    _writeObject: function(obj, preferIndirect){
        if (obj === null){
            this._writeNullObject();
        }else if (obj instanceof PDFNameObject){
            this._writeNameObject(obj);
        }else if (obj instanceof PDFIndirectObject){
            if (preferIndirect){
                this._writeIndirectObject(obj);
            }else{
                this._writeObject(obj.resolvedValue);
            }
        }else if (preferIndirect && obj && obj.indirect && obj.indirect instanceof PDFIndirectObject){
            this._writeIndirectObject(obj.indirect);
        }else if (obj instanceof PDFObject){
            this._writeDictionaryObject(obj);
        }else if (obj instanceof Array){
            this._writeArrayObject(obj);
        }else if (typeof(obj) == 'string'){
            this._writeStringObject(obj);
        }else if (typeof(obj) == 'boolean'){
            this._writeBooleanObject(obj);
        }else if (typeof(obj) == 'number'){
            this._writeNumberObject(obj);
        }else{
            this._writeDictionaryObject(obj);
        }
    },

    _writeNameObject: function(name){
        this._write(pdf_formatter.N(name));
    },

    _writeStringObject: function(str){
        this._write(pdf_formatter.S(str));
    },

    _writeNumberObject: function(n){
        this._write(pdf_formatter.n(n));
    },

    _writeBooleanObject: function(bool){
        this._write(pdf_formatter.b(bool));
    },

    _writeNullObject: function(){
        this._write("null");
    },

    _writeIndirectObject: function(obj){
        this._write("%d %d R".sprintf(obj.objectID, obj.generation));
    },

    _writeArrayObject: function(array){
        // TODO: watch out for 255 max length
        this._write("[ ");
        for (var i = 0, l = array.length; i < l; ++i){
            this._writeObject(array[i], true);
            this._write(" ");
        }
        this._write("]");
    },

    _writeDictionaryObject: function(dict){
        // TODO: watch out for 255 max length
        this._write("<< ");
        var value;
        for (var k in dict){
            value = dict[k];
            this._writeNameObject(PDFNameObject(k));
            this._write(" ");
            this._writeObject(dict[k], true);
            this._write(" ");
        }
        this._write(">>");
    },

    _write: function(data){
        if (typeof(data) == 'string'){
            if (arguments.length > 1){
                data = String.prototype.sprintf.apply(data, Array.prototype.slice.call(arguments, 1));
            }
            data = data.utf8();
        }
        this._offset += data.length;
        this._stream.write(data.bytes, 0, data.bytes.length);
    },

    _writeCrossReferenceTable: function(){
        this._crossReferenceOffset = this._offset;
        this._write("xref\n%d %d\n", 0, this._crossReferenceTable.length);
        var xref;
        for (var i = 0, l = this._crossReferenceTable.length; i < l; ++i){
            xref = this._crossReferenceTable[i];
            this._write("%010d %05d %s \n", xref.offset, xref.generation, xref.status === CrossReferenceTableEntry.Status.free ? "f" : "n");
        }
    },

    _writeTrailer: function(){
        this._trailer.Size = this._crossReferenceTable.length;
        this._write("trailer\n");
        this._writeDictionaryObject(this._trailer);
        this._write("\nstartxref\n%d\n%%%%EOF", this._crossReferenceOffset);
    },

});

JSClass("PDFWriterStream", JSObject, {

    write: function(bytes, offset, length){
    },

    close: function(callback){
    }

});

function CrossReferenceTableEntry(offset, generation, status){
    if (this === undefined){
        return new CrossReferenceTableEntry(offset, generation, status);
    }
    if (status === undefined){
        status = CrossReferenceTableEntry.Status.used;
    }
    this.offset = offset;
    this.generation = generation;
    this.status = status;
}

CrossReferenceTableEntry.Status = {
    free: 'f',
    used: 'n'
};

var pdf_formatter = {

    _maxWholeDigits: 10,
    _maxDecimalDigits: 10,

    // boolean
    b: function(b, options){
        return b === true ? "true" : "false";
    },

    // number
    n: function(n, options){
        // Number.toString() gets most cases correct for PDF, but could generate
        // some strings that are not valid PDF numbers
        // 1. NaN - No concept in PDF, unclear what to do, but 0 seems ok
        // 2. Infinity - No concept in PDF, unclear what to do, but the max number seems ok
        // 3. Exponential Notation - Not valid in PDF.  Very large or very small numbers.
        //
        // The PDF spec isn't clear on how many digits a number may have.  I've chosen
        // 10 whole digits and 10 decimal digits.  The xref table uses 10 digit numbers,
        // so that feels like a good max.  The decimal precision is more of a guess as
        // to what is necessary.
        if (n === null || n === undefined || Number.isNaN(n)){
            // TODO: warning?  error?
            return "0";
        }
        if (!Number.isFinite(n)){
            if (n < 0){
                n = -this._maxNumber;
            }else{
                n = this._maxNumber;
            }
        }
        if (n === 0){
            return "0";
        }
        var str = "";
        if (n < 0){
            str += "-";
            n = -n;
        }
        var whole = Math.floor(n);
        var decimal = Math.floor((n - whole) * pdf_formatter._decimalMultiplier + 0.5) / pdf_formatter._decimalMultiplier;
        if (decimal >= 1){
            whole += 1;
            decimal = 0;
        }
        if (whole >= pdf_formatter._maxNumber){
            var i;
            for (i = 0; i < this._maxWholeDigits; ++i){
                str += "9";
            }
            str += ".";
            for (i = 0; i < this._maxDecimalDigits; ++i){
                str += "9";
            }
        }else{
            str += whole.toString();
            if (decimal > 0){
                str += decimal.toString().substr(1);
            }
        }
        return str;
    },

    // name
    N: function(name, options){
        // TODO: escape special characters
        var str = "/" + name.value;
        return str;
    },

    // regular string
    s: function(str, options){
        return str;
    },

    S: function(str, options){
        // TODO: escapes
        return "(" + str + ")";
    }
};

pdf_formatter._maxNumber = Math.pow(10, pdf_formatter._maxWholeDigits);
pdf_formatter._decimalMultiplier = Math.pow(10, pdf_formatter._maxDecimalDigits);

})();