// #import "JSObject.js"
// #import "JSBundle.js"
'use strict';

JSClass('JSPropertyList', JSObject, {

    initWithResource: function(name, bundle){
        bundle = bundle || JSBundle.mainBundle;
        var ext = name.fileExtension;
        name = name.substr(0, name.length - ext.length);
        var metadata = bundle.metadataForResourceName(name, ext);
        if (metadata === null){
            return null;
        }
        this.initWithObject(metadata.value);
    },

    initWithObject: function(obj){
        if (obj){
            for (var i in obj){
                this[i] = obj[i];
            }
        }
    }
});
