// #feature Math.cos
// #feature Math.sin
'use strict';
/* global JSGlobalObject, JSSize, JSPoint, JSRect, JSRange, JSAffineTransform, JSConstraintBox */
// -----------------------------------------------------------------------------
// Mark: Sizes

JSGlobalObject.JSSize = function JSSize(width, height){
    if (this === undefined){
        return new JSSize(width, height);
    }else{
        if (width instanceof JSSize){
            this.width = width.width;
            this.height = width.height;
        }else{
            this.width = width;
            this.height = height;
        }
    }
};

JSSize.prototype = {
    width: 0,
    height: 0,

    isEqual: function(other){
        return this.width == other.width && this.height == other.height;
    }
};

Object.defineProperty(JSSize, 'Zero', {
    get: function(){
        return new JSSize(0, 0);
    }
});

JSGlobalObject.JSPoint = function JSPoint(x, y){
    if (this === undefined){
        return new JSPoint(x, y);
    }else{
        if (x instanceof JSPoint){
            this.x = x.x;
            this.y = x.y;
        }else{
            this.x = x;
            this.y = y;
        }
    }
};

JSPoint.prototype = {
    x: 0,
    y: 0,

    isEqual: function(other){
        return this.x == other.x && this.y == other.y;
    }
};

Object.defineProperty(JSPoint, 'Zero', {
    get: function(){
        return new JSPoint(0, 0);
    }
});

Object.defineProperty(JSPoint, 'UnitCenter', {
    get: function(){
        return new JSPoint(0.5, 0.5);
    }
});


JSGlobalObject.JSRect = function JSRect(x, y, width, height){
    if (this === undefined){
        return new JSRect(x, y, width, height);
    }else{
        if (x instanceof JSRect){
            this.origin = JSPoint(x.origin);
            this.size = JSSize(x.size);
        }else if ((x instanceof JSPoint) && (y instanceof JSSize)){
            this.origin = JSPoint(x);
            this.size = JSSize(y);
        }else{
            this.origin = JSPoint(x, y);
            this.size = JSSize(width, height);
        }
    }
};

JSRect.prototype = {
    origin: null,
    size: null,

    rectWithInsets: function(top, right, bottom, left){
        if (right === undefined) right = top;
        if (bottom === undefined) bottom = top;
        if (left === undefined) left = right;
        return new JSRect(this.origin.x + left, this.origin.y + top, this.size.width - left - right, this.size.height - top - bottom);
    },

    isEqual: function(other){
        return this.origin.isEqual(other.origin) && this.size.isEqual(other.size);
    }
};

Object.defineProperty(JSRect, 'Zero', {
    get: function(){
        return new JSRect(0, 0, 0, 0);
    }
});

JSGlobalObject.JSRange = function JSRange(location, length){
    if (this === undefined){
        return new JSRange(location, length);
    }else{
        if (location instanceof JSRange){
            this.location = location.location;
            this.length = location.length;
        }else{
            this.location = location;
            this.length = length;
        }
    }
};

JSRange.prototype = {
    location: 0,
    length: 0
};


JSGlobalObject.JSAffineTransform = function JSAffineTransform(a, b, c, d, tx, ty){
    if (this === undefined){
        return new JSAffineTransform(a, b, c, d, tx, ty);
    }else if (a instanceof JSAffineTransform){
        this.a = a.a;
        this.b = a.b;
        this.c = a.c;
        this.d = a.d;
        this.tx = a.tx;
        this.ty = a.ty;
    }else{
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }
};

JSAffineTransform.prototype = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    tx: 0,
    ty: 0,

    convertPointFromTransform: function(point){
        // X' = a * X + c * Y + tx
        // Y' = b * X + d * Y + ty
        return JSPoint(
            this.a * point.x + this.c * point.y + this.tx,
            this.b * point.x + this.d * point.y + this.ty
        );
    },

    convertPointToTransform: function(point){
        var inverse = this.inverse();
        return inverse.convertPointFromTransform(point);
    },

    scaledBy: function(sx, sy){
        return JSAffineTransform.Scaled(sx, sy).concatenatedWith(this);
    },

    translatedBy: function(tx, ty){
        return JSAffineTransform.Translated(tx, ty).concatenatedWith(this);
    },

    rotatedBy: function(rads){
        return JSAffineTransform.Rotated(rads).concatenatedWith(this);
    },

    rotatedByDegrees: function(degrees){
        return this.rotatedBy(degrees * Math.PI / 180.0);
    },

    concatenatedWith: function(transform){
        return new JSAffineTransform(
            this.a * transform.a + this.b * transform.c,
            this.a * transform.b + this.b * transform.d,
            this.c * transform.a + this.d * transform.c,
            this.c * transform.b + this.d * transform.d,
            this.tx * transform.a + this.ty * transform.c + transform.tx,
            this.tx * transform.b + this.ty * transform.d + transform.ty
        );
    },

    inverse: function(){
        var determinant = this.a * this.d - this.b * this.c;
        return  new JSAffineTransform(
            this.d / determinant,
            -this.b / determinant,
            -this.c / determinant,
            this.a / determinant,
            (this.c * this.ty - this.d * this.tx) / determinant,
            (this.b * this.tx - this.a * this.ty) / determinant
        );
    }
};

Object.defineProperty(JSAffineTransform.prototype, 'isIdentity', {
    configurable: false,
    get: function JSAffineTransform_isIdentity(){
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0;
    }
});

Object.defineProperty(JSAffineTransform.prototype, 'isRotated', {
    configurable: false,
    get: function JSAffineTransform_isIdentity(){
        return this.b !== 0 || this.c !== 0;
    }
});

Object.defineProperty(JSAffineTransform, 'Identity', {
    get: function(){
        return new JSAffineTransform(1, 0, 0, 1, 0, 0);
    }
});

JSAffineTransform.Scaled = function(sx, sy){
    if (sy === undefined) sy = sx;
    return new JSAffineTransform(sx, 0, 0, sy, 0, 0);
};

JSAffineTransform.Translated = function(tx, ty){
    return new JSAffineTransform(1, 0, 0, 1, tx, ty);
};

JSAffineTransform.Rotated = function(rads){
        var cos = Math.cos(rads);
        var sin = Math.sin(rads);
        return new JSAffineTransform(cos, sin, -sin, cos, 0, 0);
};

JSAffineTransform.RotatedDegrees = function(degs){
    return JSAffineTransform.Rotated(degs * Math.PI / 180.0);
};

JSGlobalObject.JSConstraintBox = function JSConstraintBox(props){
    if (this === undefined){
        return new JSConstraintBox(props);
    }else{
        if (props !== undefined){
            for (var x in props){
                this[x] = props[x];
            }
        }
    }
};

JSConstraintBox.prototype = {
    top: undefined,
    bottom: undefined,
    left: undefined,
    right: undefined,
    width: undefined,
    height: undefined
};

JSConstraintBox.Size = function(width, height){
    var box = JSConstraintBox();
    box.width = width;
    box.height = height;
    return box;
};

JSConstraintBox.Margin = function(top, right, bottom, left){
    var box = JSConstraintBox();
    box.top = (top === undefined) ? 0 : top;
    box.right = (right === undefined) ? box.top : right;
    box.bottom = (bottom === undefined) ? box.top : bottom;
    box.left = (left === undefined) ? box.right : left;
    return box;
};

JSConstraintBox.AnchorTop = function(height){
    return new JSConstraintBox({
        top: 0,
        left: 0,
        right: 0,
        height: height
    });
};

JSConstraintBox.AnchorLeft = function(width){
    return new JSConstraintBox({
        top: 0,
        left: 0,
        bottom: 0,
        width: width
    });
};

JSConstraintBox.AnchorBottom = function(height){
    return new JSConstraintBox({
        bottom: 0,
        left: 0,
        right: 0,
        height: height
    });
};

JSConstraintBox.AnchorRight = function(width){
    return new JSConstraintBox({
        top: 0,
        right: 0,
        bottom: 0,
        width: width
    });
};

JSConstraintBox.Rect = function(rect){
    return new JSConstraintBox({
        top: rect.origin.y,
        left: rect.origin.x,
        width: rect.size.width,
        height: rect.size.height
    });
};