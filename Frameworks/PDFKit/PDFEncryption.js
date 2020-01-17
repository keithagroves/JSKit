// #import Foundation
// #import SecurityKit
// #import "PDFCryptFilter.js"
// #import "PDFTypes.js"
/* global JSClass, JSData, JSObject, PDFEncryption, JSMD5Hash, SECCipher, PDFName */
'use strict';

(function(){

JSClass("PDFEncryption", JSObject, {

    documentId: null,
    ownerCheck: null,
    userCheck: null,
    permissions: 0,
    algorithm: 0,
    revision: 0,
    keyLengthInBytes: 5,

    documentKeyData: null,

    encryptMetadata: true,
    filterDictionaries: null,
    defaultStreamFilter: null,
    defaultStringFilter: null,
    defaultEmbeddedFilter: null,

    initWithDocumentId: function(documentId, encrypt){
        this.documentId = documentId;
        if (encrypt.Filter != "Standard"){
            this.isSupported = false;
            return;
        }
        if (encrypt.SubFilter){
            this.isSupported = false;
            return;
        }
        if (!encrypt.O || !encrypt.U || !encrypt.P){
            this.isSupported = false;
            return;
        }
        this.ownerCheck = encrypt.O;
        this.userCheck = encrypt.U;
        this.permissions = encrypt.P;
        this.algorithm = encrypt.V;
        this.revision = encrypt.R;

        this.isSupported = (this.algorithm === PDFEncryption.Algorithm.rc4_40 || this.algorithm == PDFEncryption.Algorithm.rc4 || this.algorithm == PDFEncryption.Algorithm.crypt);
        if (this.algorithm == PDFEncryption.Algorithm.rc4 || this.algorithm == PDFEncryption.Algorithm.crypt){
            if (encrypt.Length){
                if (encrypt.Length % 8 !== 0){
                    this.isSupported = false;
                }else{
                    this.keyLengthInBytes = encrypt.Length / 8;
                }
            }
        }
        if (this.algorithm == PDFEncryption.Algorithm.crypt){
            if (encrypt.EncryptMetadata === false){
                this.encryptMetadata = false;
            }
            if (encrypt.CF){
                this.filterDictionaries = encrypt.CF;
            }else{
                this.filterDictionaries = {};
            }
            if (encrypt.StmF){
                this.defaultStreamFilter = this.filterDictionaries[encrypt.StmF];
            }
            if (encrypt.StrF){
                this.defaultStringFilter = this.filterDictionaries[encrypt.StrF];
            }
            if (encrypt.EFF){
                this.defaultEmbeddedFilter = this.filterDictionaries[encrypt.EFF];
            }
        }
    },

    isSupported: false,

    hasPermission: function(permission){
        switch (this.revision){
            case 2:
                if (permission >= PDFEncryption.Permsission.form){
                    return true;
                }
                return (this.permissions & permission) == permission;
            case 3:
            case 4:
                return (this.permissions & permission) == permission;
        }
    },

    authenticateUser: function(password, completion, target){
        // a) Create an encryption key based on the user password string
        var keyData = this._generateDocumentKeyData(password);
        var cipher = SECCipher.initWithAlgorithm(SECCipher.Algorithm.rc4);
        cipher.createKeyWithData(keyData, function(key){
            if (key === null){
                completion.call(target, false);
                return;
            }
            if (this.revision >= 3){
                // b) Initialize the MD5 hash function and pass the 32-byte padding string
                var md5 = new JSMD5Hash();
                md5.start();
                md5.add(JSData.initWithArray(passwordPadding));

                // c) Pass the first element of the file's file identifier array
                md5.add(this.documentId);
                md5.finish();
                var iteration = 0;

                var handleEncryption = function(encrypted){
                    if (encrypted === null){
                        completion.call(target, false);
                        return;
                    }
                    ++iteration;
                    var i, l;
                    // e) Do the following 19 times: Take the output from the previous invocation of the RC4
                    //    function and pass it as input to a new invocation of the function; use an encryption
                    //    key generated by taking each byte of the original encryption key obtained in step (a)
                    //    and performing an XOR (exclusive or) operation between that byte and the single-byte
                    //    value of the iteration counter (from 1 to 19).
                    if (iteration < 20){
                        var newKeyData = JSData.initWithLength(keyData.length);
                        for (i = 0, l = keyData.length; i < l; ++i){
                            newKeyData[i] = keyData[i] ^ iteration;
                        }
                        cipher.createKeyWithData(newKeyData, function(newKey){
                            if (newKey === null){
                                completion.call(target, false);
                                return;
                            }
                            cipher.encrypt(encrypted, newKey, handleEncryption, this);
                        }, this);
                    }else{
                        // ... If the first 16 bytes of result are equal to the value of the encryption dictionary’s U entry, password is valid
                        var success = true;
                        for (i = 0, l = 16; i < l && success; ++i){
                            if (encrypted[i] != this.userCheck[i]){
                                success = false;
                            }
                        }
                        if (success){
                            this.documentKeyData = keyData;
                        }
                        completion.call(target, success);
                    }
                };

                // d) Encrypt the 16-byte result of the hash, using an RC4 encryption function 
                cipher.encrypt(md5.digest().truncatedToLength(16), key, handleEncryption, this);
            }else{
                // b) Encrypt the 32-byte padding string
                var paddingData = JSData.initWithArray(passwordPadding);
                cipher.encrypt(paddingData, key, function(encrypted){

                    // ... If the result is equal to the value of the encryption dictionary’s U entry, password is valid
                    var success = encrypted !== null && encrypted.isEqual(this.userCheck);
                    if (success){
                        this.documentKeyData = keyData;
                    }
                    completion.call(target, success);
                }, this);
            }
        }, this);
    },

    decryptStream: function(stream, data, completion, target){
        var cipherAlgorithm = null;
        if (this.algorithm == PDFEncryption.Algorithm.crypt){
            var filters = stream.filters();
            var filterDictionary = null;
            if (filters.length > 0 && filters[0].name == "Crypt"){
                if (filters[0].params){
                    filterDictionary = this.filterDictionaries[filters[0].params.Name];
                }
            }else{
                filterDictionary = this.defaultStreamFilter;
            }
            
            // If we couldn't find a matching filter, behave as if the stream
            // specified the /Identity filter, which just returns the data unchanged.
            if (!filterDictionary){
                completion.call(target, data);
                return;
            }

            var method = filterDictionary.CFM;

            // Unclear what we're supposed to do with the /None method.
            // For now, return data unchanged.
            if (!method || method == "None"){
                completion.call(target, data);
                return;
            }

            if (method == "V2"){
                cipherAlgorithm = SECCipher.Algorithm.rc4;
            }else if (method == "AESV2"){
                cipherAlgorithm = SECCipher.Algorithm.aesCBC;
            }else{
                // Unclear what we're supposed to do with an unknown method.
                // For now, return data unchanged.
                completion.call(target, data);
                return;
            }
        }else{
            cipherAlgorithm = SECCipher.Algorithm.rc4;
        }

        var keyData = this._generateObjectKeyData(stream.indirect.objectID, stream.indirect.generation, cipherAlgorithm);
        var cipher = SECCipher.initWithAlgorithm(cipherAlgorithm);
        cipher.createKeyWithData(keyData, function(key){
            if (key === null){
                completion.call(target, null);
                return;
            }
            cipher.decrypt(data, key, function(decrypted){
                completion.call(target, decrypted);
            }, this);
        }, this);
    },

    _dataForPassword: function(password){
        try{
            return password.latin1();
        }catch (e){
            // password can't be encoded in latin1, so it must be an invalid password and
            // we can just continue with an empty password that will fail
            // NOTE: PDF 1.7 extensions allow for unicode passwords
        }
        return JSData.initWithLength(0);
    },

    _generateDocumentKeyData: function(password){
        // a) Pad or truncate the password string to exactly 32 bytes.
        var passwordData = this._dataForPassword(password);
        var paddedPasswordData = JSData.initWithChunks([passwordData, JSData.initWithArray(passwordPadding)]).truncatedToLength(32);

        // b) Initialize the MD5 hash function and pass the result of step (a) as input to this function.
        var md5 = new JSMD5Hash();
        md5.start();
        md5.add(paddedPasswordData);

        // c) Pass the value of the encryption dictionary's O entry to the MD5 hash function
        md5.add(this.ownerCheck);

        // d) Convert the integer value of the P entry to a 32-bit unsigned binary number and pass these bytes to the MD5 hash function, low-order byte first.
        md5.add(JSData.initWithArray([
            this.permissions & 0xFF,
            (this.permissions >> 8) & 0xFF,
            (this.permissions >> 16) & 0xFF,
            (this.permissions >> 24) & 0xFF
        ]));

        // e) Pass the first element of the file's file identifier array to the MD5 hash function.
        md5.add(this.documentId);

        // f) (Security handlers of revision 4 or greater) If document metadata is not being encrypted, pass 4 bytes with the value 0xFFFFFFFF to the MD5 hash function.
        if (this.revision >= 4 && !this.encryptMetadata){
            md5.add(JSData.initWithArray([0xFF, 0xFF, 0xFF, 0xFF]));
        }

        // g) Finish the hash.
        md5.finish();

        // h) Security handlers of revision 3 or greater) Do the following 50 times: Take the output from the previous MD5 hash and pass the first n bytes of the output as input into a new MD5 hash
        // i) Set the encryption key to the first n bytes of the output from the final MD5 hash
        var keyData = md5.digest().truncatedToLength(this.keyLengthInBytes);
        if (this.revision >= 3){
            for (var i = 0; i < 50; ++i){
                keyData = JSMD5Hash(keyData).truncatedToLength(this.keyLengthInBytes);
            }
        }

        return keyData;
    },

    _generateObjectKeyData: function(objectId, generation, algorithm){
        // a) Obtain the object number and generation number from the object identifier

        var md5 = new JSMD5Hash();
        md5.start();
        md5.add(this.documentKeyData);

        // b) For all strings and streams without crypt filter specifier; treating the
        //    object number and generation number as binary integers, extend the original
        //    n-byte encryption key to n + 5 bytes by appending the low-order 3 bytes of
        //    the object number and the low-order 2 bytes of the generation number in that
        //    order, low-order byte first.
        md5.add(JSData.initWithArray([
            objectId & 0xFF,
            (objectId >> 8) & 0xFF,
            (objectId >> 16) & 0xFF,
            generation & 0xFF,
            (generation >> 8) & 0xFF
        ]));

        // ... If using the AES algorithm, extend the encryption key an additional
        //     4 bytes by adding the value “sAlT”, which corresponds to the hexadecimal
        //     values 0x73, 0x41, 0x6C, 0x54
        if (algorithm == SECCipher.Algorithm.aesCBC){
            md5.add(JSData.initWithArray([0x73, 0x41, 0x6C, 0x54]));
        }

        // c) Initialize the MD5 hash function and pass the result of step (b) as input to this function.
        md5.finish();

        // d) Use the first (n + 5) bytes, up to a maximum of 16, of the output from the MD5 hash as the key
        var keyLength = Math.min(16, this.documentKeyData.length + 5);
        var keyData = md5.digest().truncatedToLength(keyLength);
        return keyData;
    }

});

PDFEncryption.Algorithm = {
    rc4_40: 1,
    rc4: 2,
    crypt: 4
};

PDFEncryption.Permsission = {
    print: (1 << 2),
    modify: (1 << 3),
    copy: (1 << 4),
    annotate: (1 << 5),
    form: (1 << 8),
    accessibility: (1 << 9),
    assemble: (1 << 10),
    printFaithful: (1 << 11)
};

var passwordPadding = [0x28,0xBF,0x4E,0x5E,0x4E,0x75,0x8A,0x41,0x64,0x00,0x4E,0x56,0xFF,0xFA,0x01,0x08,0x2E,0x2E,0x00,0xB6,0xD0,0x68,0x3E,0x80,0x2F,0x0C,0xA9,0xFE,0x64,0x53,0x69,0x7A];

})();