// #import Foundation
// #import "SECJSONWebToken.js"
// #import "SECNodeKey.js"
/* global JSClass, JSObject, JSReadOnlyProperty, SECHash, SECVerify, JSData, crypto, SECNodeKey, SECJSONWebToken */
'use strict';

(function(){

SECJSONWebToken.definePropertiesFromExtensions({

    createVerifyKey: function(jwk, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        // RSA public key ASN.1 syntax:
        // RSAPublicKey ::= SEQUENCE {
        //     modulus           INTEGER,  -- n
        //     publicExponent    INTEGER   -- e
        // }
        // 
        var modulus = jwk.n.dataByDecodingBase64URL();
        var exp = jwk.e.dataByDecodingBase64URL();

        var i = 0;
        var length = 10 + modulus.length + exp.length;
        var der = JSData.initWithLength(length);
        var derView = der.dataView();
        der[i++] = 0x30; // SEQUENCE (RSAPublicKey)
        der[i++] = 0x82; // Two bytes of length to follow
        derView.setUint16(i, 6 + modulus.length + exp.length);
        i += 2;
        der[i++] = 0x02; // INTEGER (modulus)
        der[i++] = 0x82; // Two bytes of length to follow
        derView.setUint16(i, modulus.length);
        i += 2;
        modulus.copyTo(der, i);
        i += modulus.length;
        der[i++] = 0x02; // INTEGER (publicExponent)
        der[i++] = exp.length;
        exp.copyTo(der, i);

        var base64 = der.base64StringRepresentation(64);
        var pem = "-----BEGIN RSA PUBLIC KEY-----\n";
        pem += base64;
        pem += "\n-----END RSA PUBLIC KEY-----\n";
        var key = SECNodeKey.initWithData(pem.utf8());
        completion.call(target, key);
        return completion.promise;
    }

});

var dot = JSData.initWithArray([0x2E]);


})();