// #import "SECHash.js"
/* global JSGlobalObject, SECHash, SECVerify, JSData */
'use strict';

(function(){

JSGlobalObject.SECJWT = {

    validateToken: function(token, keys, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var parts = token.split('.');
        if (parts.length != 3){
            completion.call(target, null);
        }
        var header;
        var payload;
        var signature;
        var headerObj;
        var payloadObj;
        try{
            header = parts[0].dataByDecodingBase64URL();
            payload = parts[1].dataByDecodingBase64URL();
            signature = parts[2].dataByDecodingBase64URL();
            headerObj = JSON.parse(header.stringByDecodingUTF8());
            payloadObj = JSON.parse(payload.stringByDecodingUTF8());
        }catch (e){
            completion.call(target, null);
            return;
        }
        if (headerObj.alg == "none"){
            completion.call(target, payloadObj);
            return;
        }
        var key;
        var keyData = null;
        if (keys instanceof JSData){
            keyData = keys;
        }else{
            for (var i = 0, l = keys.length; i < l && keyData === null; ++i){
                key = keys[i];
                if (headerObj.kid == key.kid){
                    keyData = key;
                }
            }
        }
        if (keyData === null){
            completion.call(target, null);
            return;
        }
        var chunks = [parts[0].utf8(), dot, parts[1].utf8()];
        switch (headerObj.alg){
            case "HS256":
                this._verifyHash(SECHash.Algorithm.hmacSHA256, keyData, chunks, signature, payloadObj, completion, target);
                break;
            case "HS384":
                this._verifyHash(SECHash.Algorithm.hmacSHA384, keyData, chunks, signature, payloadObj, completion, target);
                break;
            case "HS512":
                this._verifyHash(SECHash.Algorithm.hmacSHA512, keyData, chunks, signature, payloadObj, completion, target);
                break;
            case "RS256":
                this._verifyRSA(SECHash.Algorithm.rsaSHA256, keyData, chunks, signature, payloadObj, completion, target);
                break;
            case "RS384":
                this._verifyRSA(SECHash.Algorithm.rsaSHA384, keyData, chunks, signature, payloadObj, completion, target);
                break;
            case "RS512":
                this._verifyRSA(SECHash.Algorithm.rsaSHA512, keyData, chunks, signature, payloadObj, completion, target);
                break;
            default:
                completion.call(target, null);
                break;
        }
        return completion.promise;
    },

    _verifyHash: function(algorithm, keyData, chunks, signature, payload, completion, target){
        var hash = SECHash.initWithAlgorithm(algorithm, keyData);
        for (var i = 0, l = chunks.length; i < l; ++i){
            hash.update(chunks[i]);
        }
        hash.digest(function(computed){
            if (computed === null || !computed.isEqual(signature)){
                completion.call(target, null);
                return;
            }
            completion.call(target, payload);
        });
    },

    _verifyRSA: function(algorithm, jwk, chunks, signature, payload, completion, target){
        var verify = SECVerify.initWithAlgorithm(algorithm);
        var key = verify.createKeyFromJWK(jwk, function(key){
            if (key === null){
                completion.call(target, false);
                return;
            }
            for (var i = 0, l = chunks.length; i < l; ++i){
                verify.update(chunks[i]);
            }
            verify.verify(key, signature, function(verified){
                if (!verified){
                    completion.call(target, null);
                    return;
                }
                completion.call(target, payload);
            });
        }, this);
    }

};

var dot = JSData.initWithArray([0x2E]);


})();