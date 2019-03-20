// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFGraphicsState.js"
// #import "PDFKit/PDFColorSpace.js"
// #import "PDFKit/PDFImage.js"
/* global JSClass, JSObject, JSColor, JSContext, JSAffineTransform, JSSize, JSRect, JSPoint, JSRange, PDFImage, PDFGraphicsState, PDFColorSpace, PDFForm */
'use strict';

(function(){

JSClass("PDFDrawing", JSObject, {

    bounds: null,
    resources: null,
    operationIterator: null,
    flipped: true,
    backgroundColor: null,

    init: function(){
        this.backgroundColor = JSColor.whiteColor;
    },

    drawInContext: function(context, rect){
        // Scale to given rect (flipping coordinates in the process)
        context.save();
        var bounds = this.bounds;
        var sx = rect.size.width / bounds.size.width;
        var sy = rect.size.height / bounds.size.height;
        if (this.flipped){
            context.translateBy(rect.origin.x, rect.origin.y + rect.size.height);
            context.scaleBy(sx, -sy);
            context.translateBy(-bounds.origin.x, -bounds.origin.y);
        }else{
            context.translateBy(rect.origin.x, rect.origin.y);
            context.scaleBy(sx, sy);
            context.translateBy(-bounds.origin.x, -bounds.origin.y);
        }

        // Clip to bounds
        context.addRect(bounds);
        context.clip();
        context.beginPath();
        context.save();

        if (this.backgroundColor){
            context.save();
            context.setFillColor(this.backgroundColor);
            context.fillRect(bounds);
            context.restore();
        }

        if (this.operationIterator !== null){
            var handler;
            var stack = PDFGraphicsState.stack();
            stack.resources = this.resources;
            var obj = {
                context: context,
                stack: stack,
                resources: this.resources,
                font: null,
                fontStack: []
            };
            var operation = this.operationIterator.next();
            while (operation !== null){
                handler = contextOperationHandler[operation.operator];
                if (handler){
                    handler.apply(obj, operation.operands);
                }
                stack.handleOperation(operation);
                operation = this.operationIterator.next();
            }
            this.operationIterator.reset();
        }

        context.restore();
        context.restore();
    },

    finish: function(){
        this.resources.unload();
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
        this.fontStack.push(this.font);
    },

    Q: function(){
        this.context.restore();
        if (this.fontStack.length > 0){
            this.font = this.fontStack.pop();
        }
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
        this.context.setLineDash(phase, Array.prototype.slice.call(array, 0));
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
        var control2 = JSPoint(c2x, c2y);
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
        this.context.clip(JSContext.FillRule.winding);
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
        if (obj instanceof PDFImage){
            var image = obj.foundationImage;
            if (image){
                // Images are drawn at 0,0 in a 1x1 unit rect
                // We need to un-flip the coordinates first
                this.context.save();
                this.context.concatenate(JSAffineTransform(1, 0, 0, -1, 0, 1));
                // this.context.setFillColor(JSColor.greenColor);
                // this.context.fillRect(JSRect(0, 0, 0.5, 0.5));
                this.context.drawImage(image, JSRect(JSPoint.Zero, JSSize(1, 1)));
                this.context.restore();
            }
        }else if (obj instanceof PDFForm){
            this.context.save();
            this.context.concatenate(obj.transform);
            obj.drawing.drawInContext(this.context, obj.drawing.bounds);
            this.context.restore();
        }
    },

    EI: function(){
        // TODO: inline image
    },

    // MARK: - Text

    Tf: function(name, size){
        var pdfFont = this.resources.font(name);
        var font = pdfFont.foundationFontOfSize(size);
        this.font = font;
        if (font){
            this.context.setFont(font);
        }
    },

    Tc: function(spacing){
        this.context.setCharacterSpacing(spacing);
    },

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

    Tj: function(data){
        if (this.stack.state.textRenderingMode == PDFGraphicsState.TextRenderingMode.invisible){
            return;
        }
        var pdfFont = this.stack.state.font;
        if (pdfFont.Subtype == "Type3"){
            // TODO: read streams and do drawing
            return;
        }
        var font = this.font;
        if (!font){
            // FIXME: We don't have a valid font...use fallback?
            return;
        }
        // if (this.stack.state.wordSpacing !== 0){
        //     if (pdfFont.Subtype == "Type1" || pdfFont.Subtype == "TrueType" || pdfFont.Subtype == "MMType1"){
        //         contextOperationHandler._textWithSimpleWordSpacing.call(this, data, pdfFont);
        //         return;
        //     }
        //     // TODO: word spacing with Type0 fonts
        // }
        var text = pdfFont.fontCompatibleStringFromData(data);
        if (text !== null){
            var textMatrix = this.stack.state.textTransform.scaledBy(this.stack.state.textHorizontalScaling, -1);
            this.context.setTextMatrix(textMatrix);
            this.context.showText(text);
            if (this.stack.state.textRenderingMode >= PDFGraphicsState.TextRenderingMode.fillAddPath && this.stack.state.textRenderingMode <= PDFGraphicsState.TextRenderingMode.addPath){
                // TODO: add glyphs to clipping path
            }
        }
    },

    _textWithSimpleWordSpacing: function(data, pdfFont){
        var chunks = [];
        var start = 0;
        var i, l;
        for (i = 0, l = data.length; i < l; ++i){
            if (data[i] == 0x20){
                chunks.push(data.subdataInRange(JSRange(start, i - start + 1)));
                start = i + 1;
            }
        }
        if (start < data.length - 1){
            chunks.push(data.subdataInRange(JSRange(start, i - start)));
        }

        var chunk;
        var text;
        var textMatrix = this.stack.state.textTransform.scaledBy(this.stack.state.textHorizontalScaling, -1);
        var width;
        for (i = 0, l = chunks.length; i < l; ++i){
            chunk = chunks[i];
            text = pdfFont.fontCompatibleStringFromData(chunk);
            this.context.setTextMatrix(textMatrix);
            this.context.showText(text);
            width = pdfFont.widthOfData(chunk, this.stack.state.characterSpacing, this.stack.state.wordSpacing);
            textMatrix = textMatrix.translatedBy(width, 0);
        }
    }

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
        this.context.setLineDash(value[1], Array.prototype.slice.call(value[0], 0));
    },
    RI: function(value){
        // TODO: ?
    },
    Font: function(value){
        var pdfFont = value[0];
        var size = value[1];
        var font = pdfFont.foundationFontOfSize(size);
        this.font = font;
        if (font){
            this.context.setFont(font);
        }
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

})();