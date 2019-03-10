// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFName.js"
/* global JSClass, JSObject, PDFFilter, PDFName */
/* global PDFASCIIHexFilter, PDFASCII85Filter, PDFLZWFilter, PDFDeflateFilter, PDFRunLengthFilter, PDFCCITTFaxFilter, PDFJBIG2Filter, PDFDCTFilter, PDFJPXFilter, PDFCryptFilter */
'use strict';

JSClass("PDFFilter", JSObject, {

    decodeParameters: null,

    initWithParametersDictionary: function(decodeParameters){
        this.decodeParameters = decodeParameters;
    },

    decode: function(input){
        throw new Error("PDFilter decode abstract method must be implemented by subclass");
    },

    encode: function(input){
        throw new Error("PDFilter encode abstract method must be implemented by subclass");
    }
});

PDFFilter.CreateChain = function(filters, decodeParameters){
    var chain = [];
    var filter;
    for (var i = 0, l = filters.length; i < l; ++i){
        filter = PDFFilter.Create(filters[i].name, filters[i].params || {});
        if (filter !== null){
            chain.push(filter);
        }
    }
    return chain;
};

PDFFilter.Create = function(name, decodeParameters){
    switch (name.toString()){
        case "ASCIIHexDecode":
            return PDFASCIIHexFilter.init();
        case "ASCII85Decode":
            return PDFASCII85Filter.init();
        case "LZWDecode":
            return PDFLZWFilter.initWithParametersDictionary(decodeParameters);
        case "FlateDecode":
            return PDFDeflateFilter.initWithParametersDictionary(decodeParameters);
        case "RunLengthDecode":
            return PDFRunLengthFilter.init();
        case "CCITTFaxDecode":
            return PDFCCITTFaxFilter.initWithParametersDictionary(decodeParameters);
        case "JBIG2Decode":
            return PDFJBIG2Filter.initWithParametersDictionary(decodeParameters);
        case "DCTDecode":
            return PDFDCTFilter.initWithParametersDictionary(decodeParameters);
        case "JPXDecode":
            return PDFJPXFilter.initWithParametersDictionary(decodeParameters);
        case "Crypt":
            return null;
    }
    return null;
};