// #import "Foundation/Javascript.js"
// #import "Foundation/JSObject.js"
// #import "Foundation/JSPropertyList.js"
// #import "Foundation/JSBundle.js"
/* global JSClass, JSObject, JSPropertyList, JSSpec, JSGlobalObject, JSResolveDottedName, JSBundle */
'use strict';

JSClass('JSSpec', JSObject, {

    _plist: null,
    _objectMap: null,
    _bundle: null,
    _baseName: null,

    initWithResource: function(resource, bundle){
        var extIndex = resource.lastIndexOf('.');
        if (extIndex > 0 && extIndex < resource.length - 1){
            this._baseName = resource.substr(0, extIndex);
        }else{
            this._baseName = resource;
        }
        this._bundle = bundle || JSBundle.mainBundle;
        var plist = JSPropertyList.initWithResource(resource, this._bundle);
        this.initWithPropertyList(plist);
    },

    initWithPropertyList: function(plist){
        this._plist = plist;
        this._objectMap = {};
    },

    filesOwner: function(){
        var value = this._plist[JSSpec.Keys.FilesOwner];
        return this.resolvedValue(value);
    },

    resolvedValue: function(value){
        if (typeof(value) == 'string'){
            if (value.length > 0){
                var c = value.charAt(0);
                var _value = value.substr(1);
                switch (c) {
                    case '#':
                        if (!(_value in this._objectMap)){
                            this._objectMap[_value] = this.resolvedValue(this._plist[_value]);
                        }
                        return this._objectMap[_value];
                    case '$':
                        return JSResolveDottedName(JSGlobalObject, _value);
                    case '.':
                        if (this._bundle !== null && this._baseName !== null){
                            return this._bundle.localizedString(_value, this._baseName);
                        }
                        return value;
                    case '\\':
                        return _value;
                }
            }
            return value;
        }
        if (typeof(value) == 'object'){
            if (JSSpec.Keys.ObjectClass in value){
                var className = value[JSSpec.Keys.ObjectClass];
                var obj = JSClass.FromName(className).initWithSpec(this, value);
                return obj;
            }else{
                return value;
            }
        }
        return value;
    }

});

JSSpec.Keys = {
    FilesOwner: "JSFilesOwner",
    ObjectClass: "JSObjectClass"
};