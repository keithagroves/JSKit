// #import "Foundation/Foundation.js"
// #import "PDFKit/PDFWriter.js"
// #import "PDFKit/PDFTypes.js"
// #import "PDFKit/JSColor+PDF.js"
// #import "PDFKit/JSRect+PDF.js"
// #import "ImageKit/ImageKit.js"
/* global JSClass, JSContext, PDFContext, PDFWriter, PDFDocumentObject, PDFPageTreeNodeObject, PDFPageObject, PDFResourcesObject, PDFGraphicsStateParametersObject, PDFNameObject, PDFStreamObject, JSAffineTransform, JSRect, PDFType1FontObject, PDFImageObject, JSData, JSImage, IKBitmap, PDFColorSpaceObject */
'use strict';

(function(){

// Note: PDF coordinates default to 0,0 in the lower left corner.
// However, this context will automatically flip the coordinates so
// 0,0 is in the upper left corner, like the default for the other 
// drawing contexts in JSKit.  This also includes flipping text
// and images automatically, too.  So even if you were to unflip
// back to default PDF coordinates, text and images would then
// be upside down (just as if you were to flip an HTML canvas context,
// for example).  Overall, it made more sense to change this PDF
// context to match the others than to change the others to match PDF.

JSClass("PDFContext", JSContext, {

    _document: null,
    _pages: null,
    _page: null,
    _content: null,
    _writer: null,
    _dpi: 72,
    _defaultPageWidthInInches: 8.5,
    _defaultPageHeightInInches: 11,

    _fontInfo: null,
    _nextFontNumber: 1,
    _fontStack: null,
    _textMatrix: null,

    _imageInfo: null,
    _nextImageNumber: 1,

    // ----------------------------------------------------------------------
    // MARK: - Creating a PDF Context

    initWithFilename: function(filename){
        // TODO: create file stream and initWithStream
    },

    initWithStream: function(stream, mediaBox){
        PDFContext.$super.init.call(this);
        this._fontInfo = {};
        this._fontStack = [];
        this._textMatrixStack = [];
        this._textMatrix = JSAffineTransform.Scaled(1, -1);
        this._imageInfo = {};
        if (mediaBox === undefined){
            mediaBox = JSRect(0, 0, this._dpi * this._defaultPageWidthInInches, this._dpi * this._defaultPageHeightInInches);
        }
        this._writer = PDFWriter.initWithStream(stream);
        this._document = PDFDocumentObject();
        this._pages = PDFPageTreeNodeObject();
        this._pages.Resources = PDFResourcesObject();
        this._pages.MediaBox = mediaBox.pdfRectangle();
        this._writer.indirect(this._pages, this._pages.Resources);
        this._document.Pages = this._pages.indirect;
    },

    // ----------------------------------------------------------------------
    // MARK: - Adjusting Default coordinates

    flipCoordinates: function(){
        if (this._page === null){
            throw new Error("Invlaid state.  Make sure to call beginPage() first");
        }
        var mediaBox = this._page.MediaBox || this._pages.MediaBox;
        this.concatenate(JSAffineTransform.Flipped(mediaBox[3] - mediaBox[1]));
    },

    // ----------------------------------------------------------------------
    // MARK: - Managing Pages & Document

    beginPage: function(options){
        if (options === undefined){
            options = {};
        }
        this.endPage();
        this._page = PDFPageObject();
        this._page.Parent = this._pages.indirect;
        this._page.Resources = PDFResourcesObject();
        if (options.mediaBox !== undefined){
            this._page.MediaBox = options.mediaBox.pdfRectangle();
        }
        this._createNewContentStream();
        this._writer.indirect(this._page, this._page.Resources);
        this.save();

        // exact equivalence to false means the default (undefined) is true
        if (options.flipCoordinates !== false){
            this.flipCoordinates();
        }
    },

    endPage: function(){
        if (this._page === null){
            return;
        }

        this.restore();
        this._endContentStream();
        this._page.normalizeContent();
        this._writer.writeObject(this._page.Resources);
        this._writer.writeObject(this._page);

        this._pages.Kids.push(this._page.indirect);
        this._pages.Count += 1;
        this._page = null;
    },

    endDocument: function(callback){
        this.endPage();
        var writer = this._writer;
        var queue = PDFJobQueue();
        queue.addJob(this, this._populateFontResources);
        queue.addJob(this, this._populateImageResources);
        queue.addJob(this, this._finalizeDocument);
        queue.done = queue.error = function(){
            writer.close(callback);
        };
        queue.execute();
    },

    _populateImageResources: function(job){
        var infos = [];
        for (var objId in this._imageInfo){
            infos.push(this._imageInfo[objId]);
        }
        if (infos.length > 0){
            if (this._pages.Resources.XObject === null){
                this._pages.Resources.XObject = {};
            }
            var imageJob;
            for (var i = infos.length - 1; i >= 0; --i){
                imageJob = job.queue.insertJob(this, this._populateImageResource);
                imageJob.imageInfo = infos[i];
            }
        }
        job.complete();
    },

    _populateImageResource: function(job){
        var info = job.imageInfo;
        var image = info.image;
        var xobjects = this._pages.Resources.XObject;
        var writer = this._writer;
        var pdfimage = PDFImageObject();
        pdfimage.Length = writer.createIndirect();
        image.getBitmap(function(bitmap){
            if (bitmap === null){
                throw new Error("null bitmap");
            }
            pdfimage.Width = bitmap.size.width;
            pdfimage.Height = bitmap.size.height;
            // TODO: embed icc profile from bitmap, if present
            pdfimage.ColorSpace = PDFColorSpaceObject.Builtin.deviceRGB;
            pdfimage.BitsPerComponent = 8;
            writer.beginStreamObject(pdfimage);
            // TODO: compress the stream
            var length = 0;
            var offset = 0;
            var stream = writer.stream;
            for (var row = 0; row < bitmap.size.height; ++row){
                for (var col = 0; col < bitmap.size.width; ++col){
                    stream.write(bitmap.data.bytes, offset, 3);
                    offset += 4;
                    length += 3;
                }
            }
            writer.endStreamObject();
            pdfimage.Length.resolvedValue = length;
            writer.writeObject(pdfimage.Length);
            xobjects[info.resourceName.value] = pdfimage.indirect;
            job.complete();
        });
    },

    _populateFontResources: function(job){
        var infos = [];
        for (var postScriptName in this._fontInfo){
            infos.push(this._fontInfo[postScriptName]);
        }
        if (infos.length > 0){
            this._pages.Resources.Font = {};
            var fontJob;
            for (var i = infos.length - 1; i >= 0; --i){
                fontJob = job.queue.insertJob(this, this._populateFontResource);
                fontJob.fontInfo = infos[i];
            }
        }
        job.complete();
    },

    _populateFontResource: function(job){
        // TODO: get TTF data from file
        // TODO: slice font to only include info.usedGlyphs
        // For a font subset, the PostScript name of the font -- the value of the font’s BaseFont entry and the font descriptor’s FontName entry -- shall begin with a tag followed by a plus sign (+). The tag shall consist of exactly six uppercase letters; the choice of letters is arbitrary, but different subsets in the same PDF file shall have different tags.
        var info = job.fontInfo;
        var fonts = this._pages.Resources.Font;
        var font = PDFType1FontObject();
        font.BaseFont = PDFNameObject("Helvetica");
        this._writer.writeObject(font);
        fonts[info.resourceName.value] = font.indirect;
        job.complete();
    },

    _finalizeDocument: function(job){
        this._writer.writeObject(this._pages.Resources);
        this._writer.writeObject(this._pages);
        this._writer.writeObject(this._document);
        job.complete();
    },

    _createNewContentStream: function(){
        this._endContentStream();
        this._content = PDFStreamObject();
        this._content.Length = this._writer.createIndirect();
        this._writer.beginStreamObject(this._content);
        this._page.Contents.push(this._content.indirect);
        this._content.Length.resolvedValue = 0;
    },

    _endContentStream: function(){
        if (this._content === null){
            return;
        }
        this._writer.endStreamObject();
        this._writer.writeObject(this._content.Length);
        this._content = null;
    },

    // ----------------------------------------------------------------------
    // MARK: - Constructing Paths

    beginPath: function(){
        PDFContext.$super.beginPath.call(this);
        this._writeStreamData("n ");
    },

    moveToPoint: function(x, y){
        PDFContext.$super.moveToPoint.call(this, x, y);
        this._writeStreamData("%n %n m ", x, y);
    },

    addLineToPoint: function(x, y){
        PDFContext.$super.addLineToPoint.call(this, x, y);
        this._writeStreamData("%n %n l ", x, y);
    },

    addRect: function(rect){
        this._rememberPoint(rect.origin);
        this._writeStreamData("%n %n %n %n re ", rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    },

    addCurveToPoint: function(point, control1, control2){
        PDFContext.$super.addCurveToPoint.call(this, point, control1, control2);
        this._writeStreamData("%n %n %n %n %n %n c ", control1.x, control1.y, control2.x, control2.y, point.x, point.y);
    },

    addQuadraticCurveToPoint: function(point, control){
        this._rememberPoint(point);
        this._writeStreamData("%n %n %n %n y ", control.x, control.y, point.x, point.y);
    },

    closePath: function(){
        PDFContext.$super.closePath.call(this);
        this._writeStreamData("h ");
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    drawPath: function(drawingMode){
        switch (drawingMode){
            case JSContext.DrawingMode.fill:
                this.fillPath(JSContext.FillRule.winding);
                break;
            case JSContext.DrawingMode.evenOddFill:
                this.fillPath(JSContext.FillRule.evenOdd);
                break;
            case JSContext.DrawingMode.stroke:
                this.strokePath();
                break;
            case JSContext.DrawingMode.fillStroke:
                this._writeStreamData("B ");
                break;
            case JSContext.DrawingMode.evenOddFillStroke:
                this._writeStreamData("B* ");
                break;
        }
    },

    fillPath: function(fillRule){
        if (fillRule == JSContext.FillRule.evenOdd){
            this._writeStreamData("f* ");
        }else{
            this._writeStreamData("f ");
        }
    },

    strokePath: function(){
        this._writeStreamData("S ");
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Shapes

    clearRect: function(rect){
        // TODO: overpaint with white?  Throw exception?  Shouldn't really be called for PDFs
    },

    // ----------------------------------------------------------------------
    // MARK: - Images

    drawImage: function(image, rect){
        // TODO: pdf images
        // TODO: support svg images (perhaps by compiling them to PDF)
        var info = this._infoForImage(image);
        this.save();
        var transform = JSAffineTransform.Translated(rect.origin.x, rect.origin.y + rect.size.height).scaledBy(rect.size.width, -rect.size.height);
        this.concatenate(transform);
        this._writeStreamData("%N Do ", info.resourceName);
        this.restore();
    },

    _infoForImage: function(image){
        var info = this._imageInfo[image.objectID];
        if (!info){
            info = this._imageInfo[image.objectID] = PDFImageInfo(image);
            info.resourceName = PDFNameObject("IM%d".sprintf(this._nextImageNumber++));
        }
        return info;
    },

    // ----------------------------------------------------------------------
    // MARK: - Gradients

    drawLinearGradient: function(gradient, start, end){
        // TODO: (Section 8.7.4, Shading)
    },

    drawRadialGradient: function(gradient, startCenter, startRadius, endCenter, endRadius){
        // TODO: (Section 8.7.4, Shading)
    },

    // ----------------------------------------------------------------------
    // MARK: - Text

    setTextMatrix: function(tm){
        this._textMatrix = tm;
    },

    setTextPosition: function(textPosition){
        // TODO: PDF command
    },

    setFont: function(font){
        this._font = font;
    },

    setTextDrawingMode: function(textDrawingMode){
        this._writeStreamData("%n Tr ", textDrawingMode);
    },

    showGlyphs: function(glyphs, points){
        // TODO: if any glyphs are bitmaps (like in emoji fonts), might need to draw them as images
        var chars = this._font.charactersForGlyphs(glyphs);
        var info = this._infoForFont(this._font);
        var encoded = this._encodedString(chars, info);
        var tm = this._textMatrix;
        info.useGlyphs(glyphs);
        info.hasMacEncoding = info.hasMacEncoding || encoded.isMacEncoding;
        info.hasUTF16Encoding = info.hasUTF16Encoding || !encoded.isMacEncoding;
        // TODO: positioning
        this._writeStreamData("BT %N %n Tf ", encoded.fontResourceName, this._font.pointSize);
        this._writeStreamData("%n %n %n %n %n %n Tm ", tm.a, tm.b, tm.c, tm.d, tm.tx, tm.ty);
        this._writeStreamData("%n %n Td ", points[0].x, points[0].y);
        this._writeStreamData("%S Tj ", encoded.string);
        this._writeStreamData("ET ");
    },

    _encodedString: function(chars, info){
        var codes = [];
        for (var i = 0, l = chars.length; i < l; ++i){
            codes.push(chars[i].code);
        }
        // TODO: determine which encoding to use, and build a string
        return {
            string: String.fromCodePoint.apply(null, codes),
            fontResourceName: info.resourceName,
            isMacEncoding: false
        };
    },

    _infoForFont: function(font){
        var info = this._fontInfo[font.postScriptName];
        if (!info){
            info = this._fontInfo[font.postScriptName] = PDFFontInfo(font);
            info.resourceName = PDFNameObject("F%d".sprintf(this._nextFontNumber++));
        }
        return info;
    },

    // ----------------------------------------------------------------------
    // MARK: - Fill, Stroke, Shadow Colors

    setAlpha: function(alpha){
        // TODO: adjust state parameter dictionary with alpha
    },

    setFillColor: function(fillColor){
        this._writeStreamData(fillColor.pdfFillColorCommand());
        // TODO: adjust state parameter dictionary with alpha
    },

    setStrokeColor: function(strokeColor){
        this._writeStreamData(strokeColor.pdfStrokeColorCommand());
        // TODO: adjust state parameter dictionary with alpha
    },

    setShadow: function(offset, blur, color){
        // Doesn't seem to be a supported operation in PDF
    },

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    clip: function(fillRule){
        if (fillRule == JSContext.FillRule.evenOdd){
            this._writeStreamData("W* ");
        }else{
            this._writeStreamData("W ");
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Transformations

    scaleBy: function(sx, sy){
        this.concatenate(JSAffineTransform.Scaled(sx, sy));
    },

    rotateBy: function(angle){
        this.concatenate(JSAffineTransform.Rotated(angle));
    },

    translateBy: function(tx, ty){
        this.concatenate(JSAffineTransform.Translated(tx, ty));
    },

    concatenate: function(tm){
        this._writeStreamData("%n %n %n %n %n %n cm ", tm.a, tm.b, tm.c, tm.d, tm.tx, tm.ty);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    setLineWidth: function(lineWidth){
        this._writeStreamData("%s w ".sprintf(lineWidth));
    },

    setLineCap: function(lineCap){
        switch (lineCap){
            case JSContext.LineCap.butt:
                this._writeStreamData("0 J ");
                break;
            case JSContext.LineCap.round:
                this._writeStreamData("1 J ");
                break;
            case JSContext.LineCap.square:
                this._writeStreamData("2 J ");
                break;
        }
    },

    setLineJoin: function(lineJoin){
        switch (lineJoin){
            case JSContext.LineJoin.miter:
                this._writeStreamData("0 j ");
                break;
            case JSContext.LineJoin.round:
                this._writeStreamData("1 j ");
                break;
            case JSContext.LineJoin.bevel:
                this._writeStreamData("2 j ");
                break;
        }
    },

    setMiterLimit: function(miterLimit){
        this._writeStreamData("%n M ", miterLimit);
    },

    setLineDash: function(phase, lengths){
        var lengthsStr = "";
        for (var i = 0, l = lengths.length; i < l; ++i){
            lengthsStr += this._writer.format("%n ", lengths[i]);
        }
        this._writeStreamData("[ %s] %n d ", lengthsStr, phase);
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    save: function(){
        this._writeStreamData("q ");
        this._fontStack.push(this._font);
        this._textMatrixStack.push(this._textMatrix);
    },

    restore: function(){
        this._writeStreamData("Q ");
        this._font = this._fontStack.pop();
        this._textMatrix = this._textMatrixStack.pop();
    },

    // ----------------------------------------------------------------------
    // MARK: - Private Helpers

    _writeStreamData: function(data){
        if (this._content === null){
            throw new Error("Cannot perform operation, invalid state.  Make sure to call beginPage() first.");
        }
        if (typeof(data) === 'string'){
            if (arguments.length > 1){
                data = this._writer.format.apply(this._writer, arguments);
            }
            if (data[data.length - 1] != " "){
                data += " ";
            }
            data = data.utf8();
        }
        this._writer.writeStreamData(data);
        this._content.Length.resolvedValue += data.length;
    },

});

var PDFFontInfo = function(font){
    if (this === undefined){
        return new PDFFontInfo(font);
    }
    this.font = font;
    this.resourceName = null;
    this.usedGlyphs = [];
};

PDFFontInfo.prototype = {

    useGlyphs: function(glyphs){
        for (var i = 0, l = glyphs.length; i < l; ++i){
            this._useGlyph(glyphs[i]);
        }
    },

    _useGlyph: function(glyph){
        var min = 0;
        var max = this.usedGlyphs.length;
        var mid;
        while (min < max){
            mid = min + Math.floor((max - min) / 2);
            if (glyph < this.usedGlyphs[mid]){
                max = mid;
            }else if (glyph > this.usedGlyphs[mid]){
                min = mid + 1;
            }else{
                return;
            }
        }
        this.usedGlyphs.splice(mid, 0, glyph);
    }
};

var PDFImageInfo = function(image){
    if (this === undefined){
        return new PDFImageInfo(image);
    }
    this.image = image;
    this.resourceName = null;
};

PDFImageInfo.prototype = {
};

var PDFJobQueue = function(){
    if (this === undefined){
        return new PDFJobQueue();
    }
    this._currentJobIndex = -1;
    this._jobs = [];
};

PDFJobQueue.prototype = {

    error: function(){
    },

    done: function(){
    },

    addJob: function(target, action){
        var job = PDFJob(this, target, action);
        this._jobs.push(job);
        return job;
    },

    insertJob: function(target, action){
        var job = PDFJob(this, target, action);
        this._jobs.splice(this._currentJobIndex + 1, 0, job);
        return job;
    },

    execute: function(){
        this._runNextJob();
    },

    _runNextJob: function(){
        ++this._currentJobIndex;
        if (this._currentJobIndex == this._jobs.length){
            this._cleanup();
            this.done();
            return;
        }
        this._jobs[this._currentJobIndex].run();
    },

    _jobDidComplete: function(){
        this._runNextJob();
    },

    _jobDidError: function(){
        this._cleanup();
        this.error();
    },

    _cleanup: function(){
        this._jobs = [];
        this._currentJobIndex = -1;
    }

};

var PDFJob = function(queue, target, action){
    if (this === undefined){
        return new PDFJob(queue, target, action);
    }
    this.queue = queue;
    this.resourceName = null;
    this._target = target;
    this._action = action;
};

PDFJob.prototype = {
    run: function(){
        this._action.call(this._target, this);
    },

    complete: function(){
        this.queue._jobDidComplete();
    },

    error: function(){
        this.queue._jobDidError();
    }
};

})();