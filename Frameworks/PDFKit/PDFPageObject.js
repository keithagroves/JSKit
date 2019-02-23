// #import "PDFKit/PDFObject.js"
// #import "PDFKit/PDFNameObject.js"
// #import "PDFKit/PDFStreamObject.js"
// #import "PDFKit/PDFStreamOperation.js"
// #import "PDFKit/PDFGraphicsState.js"
// #import "PDFKit/PDFColorSpace.js"
/* global JSGlobalObject, JSData, JSPoint, JSSize, JSRect, JSColor, JSAffineTransform, JSContext, PDFObject, PDFColorSpace, PDFObjectProperty, PDFPageObject, PDFNameObject, PDFResourcesObject, PDFStreamObject, PDFStreamOperation, PDFGraphicsState */
'use strict';

(function(){

JSGlobalObject.PDFPageObject = function(){
    if (this === undefined){
        return new PDFPageObject();
    }
};

JSGlobalObject.PDFPageObject.prototype = Object.create(PDFObject.prototype, {
    Type:                   { enumerable: true, value: PDFNameObject("Page") },
    Parent:                 PDFObjectProperty,
    LastModified:           PDFObjectProperty,
    Resources:              PDFObjectProperty,
    MediaBox:               PDFObjectProperty,
    CropBox:                PDFObjectProperty,
    BleedBox:               PDFObjectProperty,
    TrimBox:                PDFObjectProperty,
    ArtBox:                 PDFObjectProperty,
    BoxColorInfo:           PDFObjectProperty,
    Contents:               PDFObjectProperty,
    Rotate:                 PDFObjectProperty,
    Group:                  PDFObjectProperty,
    Thumb:                  PDFObjectProperty,
    B:                      PDFObjectProperty,
    Dur:                    PDFObjectProperty,
    Trans:                  PDFObjectProperty,
    Annots:                 PDFObjectProperty,
    AA:                     PDFObjectProperty,
    Metadata:               PDFObjectProperty,
    PieceInfo:              PDFObjectProperty,
    StructParents:          PDFObjectProperty,
    ID:                     PDFObjectProperty,
    PZ:                     PDFObjectProperty,
    SeparationInfo:         PDFObjectProperty,
    Tabs:                   PDFObjectProperty,
    TemplateInstantiated:   PDFObjectProperty,
    PresSteps:              PDFObjectProperty,
    UserUnit:               PDFObjectProperty,
    VP:                     PDFObjectProperty,

    effectiveMediaBox: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveMediaBox(){
            if (this.MediaBox){
                return this.MediaBox;
            }
            if (this.Parent){
                return this.Parent.effectiveMediaBox;
            }
            return [0, 0, 100, 100];
        }
    },

    inheritedCropBox: {
        enumerable: false,
        get: function PDFPageObject_getInheritedCropBox(){
            if (this.CropBox){
                return this.CropBox;
            }
            if (this.Parent){
                return this.Parent.inheritedCropBox;
            }
            return null;
        }
    },

    effectiveCropBox: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveCropBox(){
            var box = this.inheritedCropBox;
            if (box){
                return box;
            }
            return this.effectiveMediaBox;
        }
    },

    effectiveRotation: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveRotation(){
            if (this.Rotate){
                return this.Rotate;
            }
            if (this.Parent){
                return this.Parent.effectiveRotation;
            }
            return 0;
        }
    },


    effectiveResources: {
        enumerable: false,
        get: function PDFPageObject_getEffectiveResources(){
            if (this.Resources){
                return this.Resources;
            }
            if (this.Parent){
                return this.Parent.effectiveResources;
            }
            return PDFResourcesObject();
        }
    },

    bounds: {
        configurable: true,
        get: function PDFPageObject_getBounds(){
            var mediaBox = normalizedBox(this.effectiveMediaBox);
            var cropBox = normalizedBox(this.effectiveCropBox, mediaBox);
            var contentBox;
            if (this.ArtBox){
                contentBox = normalizedBox(this.ArtBox, cropBox);
            }else if (this.TrimBox){
                contentBox = normalizedBox(this.TrimBox, cropBox);
            }else{
                contentBox = cropBox;
            }
            var bounds = JSRect(contentBox[0], contentBox[1], contentBox[2] - contentBox[0], contentBox[3] - contentBox[1]);
            Object.defineProperty(this, 'bounds', { value: bounds });
            return bounds;
        }
    },

    getContentsData: {
        value: function PDFPageObject_getContentsData(completion, target){
            var contents = this.Contents;
            if (!contents){
                completion.call(target, null);
                return;
            }
            if (contents instanceof PDFStreamObject){
                contents.getData(completion, target);
                return;
            }
            if (contents.length === 0){
                completion.call(target, null);
                return;
            }
            var chunks = [];
            var contentIndex = 0;
            var handleChunk = function(chunk){
                chunks.push(chunk.bytes);
                ++contentIndex;
                if (contentIndex < contents.length){
                    contents[contentIndex].getData(handleChunk);
                }else{
                    var data = JSData.initWithChunks(chunks);
                    completion.call(target, data);
                }
            };
            contents[contentIndex].getData(handleChunk, this);
        }
    },

    _getStreams: {
        value: function PDFPageObject_getStreams(){
            var contents = this.Contents;
            if (!contents){
                return [];
            }
            if (contents instanceof PDFStreamObject){
                return [contents];
            }
            return contents;
        }
    },

    getText: {
        value: function PDFPageObject_getText(completion, target){
            var streams = this._getStreams();
            if (streams.length === 0){
                completion.call(target, "");
            }
            var streamIndex = 0;
            var placedStrings = [];
            var resources = this.effectiveResources;

            var handleOperationIterator = function PDFPageObject_getText_handleOperationIterator(iterator){
                var operation = iterator.next();
                var text;
                var stack = PDFGraphicsState.stack();
                stack.resources = resources;
                var transform;
                var placed;
                while (operation !== null){
                    switch (operation.operator){
                        case Op.text:
                            transform = stack.state.textTransform.concatenatedWith(stack.state.transform);
                            text = stack.state.font.stringFromData(operation.operands[0]);
                            placed = {
                                origin: transform.convertPointFromTransform(JSPoint.Zero),
                                width: 0,
                                text: text
                            };
                            stack.handleOperation(operation);
                            transform = stack.state.textTransform.concatenatedWith(stack.state.transform);
                            placed.width = transform.convertPointFromTransform(JSPoint.Zero).x - placed.origin.x;
                            // TODO: save space width so we can use it to compare later?
                            // TODO: save font or font size so we can use it to compare later?
                            placedStrings.push(placed);
                            break;
                        default:
                            stack.handleOperation(operation);
                            break;
                    }
                    operation = iterator.next();
                }
                ++streamIndex;
                if (streamIndex < streams.length){
                    streams[streamIndex].getOperationIterator(handleOperationIterator, this);
                }else{
                    finish();
                }
            };
            var finish = function PDFPageObject_getText_consolidateText(){
                var text = "";
                // TODO: analyze placedStrings and combine adjacent runs
                // - combine horizontally anything less than a space distance
                // - combine vertically anything that looks like a soft line break
                // - watch out for columns...
                // - remember that y gets decreases from the top of the page to the bottom (0)
                var placed;
                for (var i = 0, l = placedStrings.length; i < l; ++i){
                    placed = placedStrings[i];
                    text += placed.text;
                }

                resources.unload();

                completion.call(target, text);
            };

            resources.load(function PDFPageObject_getText_loadResources(){
                streams[streamIndex].getOperationIterator(handleOperationIterator, this);
            }, this);
        }
    },

    drawInContext: {
        value: function(context, rect, completion, target){
            var streams = this._getStreams();
            if (streams.length === 0){
                completion.call(target);
            }
            var streamIndex = 0;
            var resources = this.effectiveResources;
            // TODO: annotations

            context.save();
            var bounds = this.bounds;
            context.translateBy(rect.origin.x, rect.origin.y);
            var sx = rect.size.width / bounds.size.width;
            var sy = rect.size.height / bounds.size.height;
            context.scaleBy(sx, sy);
            context.translateBy(-bounds.origin.x, -bounds.origin.y);
            context.addRect(bounds);
            context.clip();
            context.save();

            var handleOperationIterator = function PDFPageObject_drawInContext_handleOperationIterator(iterator){
                var handler;
                var stack = PDFGraphicsState.stack();
                stack.resources = resources;
                var obj = {
                    context: context,
                    stack: stack,
                    resources: resources
                };
                var operation = iterator.next();
                while (operation !== null){
                    handler = contextOperationHandler[operation.operator];
                    if (handler){
                        handler.apply(obj, operation.operands);
                    }
                    stack.handleOperation(operation);
                    operation = iterator.next();
                }
                ++streamIndex;
                if (streamIndex < streams.length){
                    streams[streamIndex].getOperationIterator(handleOperationIterator, this);
                }else{
                    finish();
                }
            };

            var finish = function PDFPageObject_drawInContext_cleanup(){
                context.restore();
                context.restore();
                resources.unload();
                completion.call(target);
            };

            resources.load(function PDFPageObject_drawInContext_loadResources(){
                streams[streamIndex].getOperationIterator(handleOperationIterator, this);
            }, this);
        }
    }
});

JSContext.definePropertiesFromExtensions({

    setPDFLineCap: function(pdfLineCap){
        switch (pdfLineCap){
            case PDFGraphicsState.LineCap.butt:
                this.setLineCap(JSContext.LineCap.butt);
                break;
            case PDFGraphicsState.LineCap.round:
                this.setLineCap(JSContext.LineCap.round);
                break;
            case PDFGraphicsState.LineCap.square:
                this.setLineCap(JSContext.LineCap.square);
                break;
        }
    },

    setPDFLineJoin: function(pdfLineJoin){
        switch (pdfLineJoin){
            case PDFGraphicsState.LineJoin.miter:
                this.setLineJoin(JSContext.LineJoin.miter);
                break;
            case PDFGraphicsState.LineJoin.round:
                this.setLineJoin(JSContext.LineJoin.round);
                break;
            case PDFGraphicsState.LineJoin.bevel:
                this.setLineJoin(JSContext.LineJoin.bevel);
                break;
        }
    }

});

var contextOperationHandler = {

    // MARK: - Graphics State

    q: function(){
        this.context.save();
    },

    Q: function(){
        this.context.restore();
    },

    cm: function(a, b, c, d, e, f){
        var transform = JSAffineTransform(a, b, c, d, e, f);
        this.context.concatenate(transform);
    },

    w: function(lineWidth){
        this.context.setLineWidth(lineWidth);
    },

    J: function(lineCap){
        this.context.setPDFLineCap(lineCap);
    },

    j: function(lineJoin){
        this.context.setPDFLineJoin(lineJoin);
    },

    M: function(miterLimit){
        this.context.setMiterLimit(miterLimit);
    },

    d: function(array, phase){
        this.context.setLineDash(phase, array);
    },

    ri: function(renderingIntent){
        // TODO: 
    },

    i: function(flatness){
        // TODO: ?
    },

    gs: function(name){
        var params = this.resources.graphicsState(name);
        if (!params){
            return;
        }
        var updater;
        for (var key in params){
            updater = contextStateUpdater[key];
            if (updater){
                updater.call(this, params[key]);
            }
        }
    },

    // MARK: - Path Construction

    m: function(x, y){
        this.context.moveToPoint(x, y);
    },

    l: function(x, y){
        this.context.addLineToPoint(x, y);
    },

    c: function(c1x, c1y, c2x, c2y, x, y){
        var point = JSPoint(x, y);
        var control1 = JSPoint(c1x, c1y);
        var control2 = JSPoint(c2x, c2x);
        this.context.addCurveToPoint(point, control1, control2);
    },

    v: function(c2x, c2y, x, y){
        var point = JSPoint(x, y);
        var control1 = this.stack.state.lastPoint;
        if (!control1){
            return;
        }
        var control2 = JSPoint(c2x, c2y);
        this.context.addCurveToPoint(point, control1, control2);
    },

    y: function(c1x, c1y, x, y){
        var point = JSPoint(x, y);
        var control1 = JSPoint(c1x, c1y);
        var control2 = point;
        this.context.addCurveToPoint(point, control1, control2);
    },

    h: function(){
        this.context.closePath();
    },

    re: function(x, y, w, h){
        var rect = JSRect(x, y, w, h);
        this.context.addRect(rect);
    },

    n: function(){
        this.context.beginPath();
    },

    W: function(){
        this.context.clip(JSContext.fillRule.winding);
    },

    'W*': function(){
        this.context.clip(JSContext.FillRule.evenOdd);
    },

    // MARK: - Path Painting

    S: function(){
        this.context.strokePath();
    },

    s: function(){
        this.context.closePath();
        this.context.strokePath();
    },

    f: function(){
        this.context.fillPath(JSContext.FillRule.winding);
    },

    'f*': function(){
        this.context.fillPath(JSContext.FillRule.evenOdd);
    },

    B: function(){
        this.context.drawPath(JSContext.DrawingMode.fillStroke);
    },

    'B*': function(){
        this.context.drawPath(JSContext.DrawingMode.evenOddFillStroke);
    },

    b: function(){
        this.context.closePath();
        this.context.drawPath(JSContext.DrawingMode.fillStroke);
    },

    'b*': function(){
        this.context.closePath();
        this.context.drawPath(JSContext.DrawingMode.evenOddFillStroke);
    },

    // MARK: - Colors

    CS: function(name){
        // changing color space always defaults the color black
        this.context.setStrokeColor(JSColor.blackColor);
    },

    cs: function(name){
        // changing color space always defaults the color black
        this.context.setFillColor(JSColor.blackColor);
    },

    SC: function(){
        var space = this.stack.state.strokeColorSpace;
        var components = Array.prototype.slice.call(arguments, 0);
        var color = space.colorFromComponents(components);
        this.context.setStrokeColor(color);
    },

    sc: function(){
        var space = this.stack.state.fillColorSpace;
        var components = Array.prototype.slice.call(arguments, 0);
        var color = space.colorFromComponents(components);
        this.context.setFillColor(color);
    },

    SCN: function(){
        var space = this.stack.state.strokeColorSpace;
        var components = Array.prototype.slice.call(arguments, 0);
        var color = space.colorFromComponents(components);
        this.context.setStrokeColor(color);
    },

    scn: function(){
        var space = this.stack.state.fillColorSpace;
        var components = Array.prototype.slice.call(arguments, 0);
        var color = space.colorFromComponents(components);
        this.context.setFillColor(color);
    },

    G: function(w){
        var color = PDFColorSpace.deviceGray.colorFromComponents([w]);
        this.context.setStrokeColor(color);
    },

    g: function(w){
        var color = PDFColorSpace.deviceGray.colorFromComponents([w]);
        this.context.setFillColor(color);
    },

    RG: function(r, g, b){
        var color = PDFColorSpace.deviceRGB.colorFromComponents([r, g, b]);
        this.context.setStrokeColor(color);
    },

    rg: function(r, g, b){
        var color = PDFColorSpace.deviceRGB.colorFromComponents([r, g, b]);
        this.context.setFillColor(color);
    },

    K: function(c, m, y, k){
        var color = PDFColorSpace.deviceCMYK.colorFromComponents([c, m, y, k]);
        this.context.setFillColor(color);
    },

    k: function(c, m, y, k){
        var color = PDFColorSpace.deviceCMYK.colorFromComponents([c, m, y, k]);
        this.context.setFillColor(color);
    },

    // MARK: - External Objects (images, etc)

    Do: function(name){
        var obj = this.resources.xObject(name);
        if (!obj){
            return;
        }
        if (obj.Subtype == "Image"){
            // TODO: get JSImage from PDFImage
            // - JSImage needs to be convertable to IKBitmap (for pdf contexts)
            // - JSImage needs to have a URL (for html contexts)
            //
            // - Could have new IKBitmap-backed JSImage subclass for images read out
            //   of PDFs, but need to figure out the URL (and therefore content-type)
            // - Could always extract a data-based JSImage from PDF, but need to
            //   convert the extracted bitmap to a supported type like PNG or JPEG
            // - JPEGs could be easy if we can can just pass around the compressed
            //   blob instead of an uncompressed bitmap.  Need to verify a PDF filter
            //   is compatible, and then somehow avoid uncompressing.
            var image = null;
            if (image){
                this.context.drawImage(image, JSRect(JSPoint.Zero, image.size));
            }
        }
        // TODO: other objects
    },

    EI: function(){
        // TODO: inline image
    },

    // MARK: - Text

    Tr: function(renderingMode){
        switch (renderingMode){
            case PDFGraphicsState.TextRenderingMode.fill:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.fill);
                break;
            case PDFGraphicsState.TextRenderingMode.stroke:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.stroke);
                break;
            case PDFGraphicsState.TextRenderingMode.fillStroke:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.fillStroke);
                break;
            case PDFGraphicsState.TextRenderingMode.invisible:
                break;
            case PDFGraphicsState.TextRenderingMode.fillAddPath:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.fill);
                break;
            case PDFGraphicsState.TextRenderingMode.strokeAddPath:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.stroke);
                break;
            case PDFGraphicsState.TextRenderingMode.fillStrokeAddPath:
                this.context.setTextDrawingMode(JSContext.TextDrawingMode.fillStroke);
                break;
            case PDFGraphicsState.TextRenderingMode.addPath:
                break;
        }
    },

    Tj: function(str){
        if (this.stack.state.textRenderingMode == PDFGraphicsState.TextRenderingMode.invisible){
            return;
        }
        // TODO: figure out canvas API
        var glyphs = [];
        this.canvas.showGlyphs(glyphs);
        if (this.stack.state.textRenderingMode >= PDFGraphicsState.TextRenderingMode.fillAddPath && this.stack.state.textRenderingMode <= PDFGraphicsState.TextRenderingMode.addPath){
            // TODO: add glyphs to clipping path
        }
    },

};

var contextStateUpdater = {
    LW: function(value){
        this.context.setLineWidth(value);
    },
    LC: function(value){
        this.context.setPDFLineCap(value);
    },
    LJ: function(value){
        this.context.setPDFLineJoin(value);
    },
    ML: function(value){
        this.context.setMiterLimit(value);
    },
    D: function(value){
        this.context.setLineDash(value[1], value[0]);
    },
    RI: function(value){
        // TODO: ?
    },
    Font: function(value){
        // TODO: how to get a JSFont?
        // Probably make a special PDFFont subclass that PDFContext can passthrough easily
        // Need to coordinate with resources, which will cache all the data for a font
    },
    FL: function(value){
        // TODO: ?
    },
    SA: function(value){
        // TODO: ?
    },
    BM: function(value){
        // TODO: ?
    },
    CA: function(value){
        // TODO: ?
    },
    ca: function(value){
        // TODO: ?
    },
    AIS: function(value){
        // TODO: ?
    }
};


var Op = PDFStreamOperation.Operator;


var normalizedBox = function(box, intersectingBox){
    var tmp;
    var normalized = [box[0], box[1], box[2], box[3]];
    if (normalized[2] < normalized[0]){
        tmp = normalized[0];
        normalized[0] = normalized[2];
        normalized[2] = tmp;
    }
    if (normalized[3] < normalized[1]){
        tmp = normalized[1];
        normalized[1] = normalized[3];
        normalized[3] = tmp;
    }
    if (intersectingBox){
        if (normalized[0] < intersectingBox[0]){
            normalized[0] = intersectingBox[0];
        }
        if (normalized[1] < intersectingBox[1]){
            normalized[1] = intersectingBox[1];
        }
        if (normalized[2] > intersectingBox[2]){
            normalized[2] = intersectingBox[2];
        }
        if (normalized[3] > intersectingBox[3]){
            normalized[3] = intersectingBox[3];
        }
    }
    return normalized;
};

})();