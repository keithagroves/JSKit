// #import "Foundation/Foundation.js"
// #import "UIKit/UIView.js"
// #import "UIKit/UIHTMLDisplayServerContext.js"
// #import "UIKit/SVGPathSegList.js"
/* global SVGLength, JSClass, UILayer, JSContext, JSAffineTransform, JSColor, JSObject, UIHTMLDisplayServerContext, UIHTMLDisplayServerSVGContext, JSCustomProperty, JSDynamicProperty, JSLazyInitProperty, JSPoint, JSContextLineDash, UIView */
'use strict';

(function(){

// Context element
// g
//   shadow?
//   backgroundColor?
//   backgroundGradient?
//   customDrawing?
//   sublayer*
//   border?

JSClass("UIHTMLDisplayServerSVGContext", UIHTMLDisplayServerContext, {

    // ----------------------------------------------------------------------
    // MARK: - Creating a Context

    initScreenInContainer: function(containerElement){
        UIHTMLDisplayServerSVGContext.$super.init.call(this);
        var doc = containerElement.ownerDocument;
        this.element = doc.createElementNS(SVGNamespace, "svg");
        this.element.setAttribute("version", "1.1");
        this.element.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 100);
        this.element.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 100);
        this.element.style.pointerEvents = 'none';
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this._definitionsElement = doc.createElementNS(SVGNamespace, "defs");
        this.element.appendChild(this._definitionsElement);
        this.firstSublayerNodeIndex = 1;
    },

    initForScreenContext: function(screenContext){
        UIHTMLDisplayServerSVGContext.$super.init.call(this);
        var doc = screenContext.element.ownerDocument;
        var svg = screenContext.element;
        this.element = doc.createElementNS(SVGNamespace, "g");
        this.originTransform = svg.createSVGTransform();
        this.element.transform.baseVal.appendItem(this.originTransform);

        this._uniqueIdPrefix = "context-" + this.objectID + "-";
        this._definitionsElement = screenContext._definitionsElement;

        this._state = Object.create(State);
        this._stack = [];
        this._imageMasks = [];
        this._propertiesNeedingUpdate = {
            bounds: true,
            transform: true,
            hidden: true,
            clipsToBounds: true,
            alpha: true,
            background: true,
            borderColor: true,
            borderWidth: true,
            shadowColor: true,
            shadowRadius: true,
            shadowOffset: true
        };
    },

    _definitionsElement: null,
    _uniqueIdPrefix: null,

    destroy: function(){
        if (this._shadowFilter){
            this._shadowFilter.parentNode.removeChild(this._shadowFilter);
        }
        if (this._backgroundGradient){
            this._backgroundGradient.parentNode.removeChild(this._backgroundGradient);
        }
        UIHTMLDisplayServerSVGContext.$super.destroy.call(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Size & Position

    setOrigin: function(origin){
        this.originTransform.setTranslate(origin.x, origin.y);
    },

    setSize: function(size){
        // only called for the root context, which has an svg element
        this.element.width.baseVal.value = size.width;
        this.element.height.baseVal.value = size.height;
    },

    originTransform: null,
    layerTransorm: null,

    // ----------------------------------------------------------------------
    // MARK: - Display Lifecycle

    layerDidChangeProperty: function(layer, property){
        switch (property){
            case 'cornerRadius':
            case 'maskedBorders':
            case 'maskedCorners':
                this._needsBoundsPathsRedraw = true;
                break;
            case 'bounds':
                this._propertiesNeedingUpdate.bounds = true;
                this._needsBoundsPathsRedraw = true;
                break;
            case 'borderWidth':
                this._propertiesNeedingUpdate.borderWidth = true;
                this._needsBoundsPathsRedraw = true;
                break;
            case 'backgroundColor':
            case 'backgroundGradient':
                this._propertiesNeedingUpdate.background = true;
                break;
            default:
                this._propertiesNeedingUpdate[property] = true;
                break;
        }
    },

    drawLayer: function(layer){
        var methodName;
        for (var property in this._propertiesNeedingUpdate){
            methodName = 'updateSVG_' + property;
            this[methodName](layer);
        }
        if (this._needsBoundsPathsRedraw){
            if (this._backgroundPath !== null || this._backgroundGradientPath !== null){
                this._updateBackgroundPath(layer);
            }
            if (this._borderPath !== null){
                this._updateBorderPath(layer);
            }
            if (this._shadowPath !== null){
                this._updateShadowPath(layer);
            }
            this._needsBoundsPathsRedraw = false;
        }
        this._colorFilterIndex = 0;
        if (this.needsCustomDisplay){
            if (this._state.groupElement){
                this._state.groupElement.parentNode.removeChild(this._state.groupElement);
                --this.firstSublayerNodeIndex;
            }
            this._state.groupElement = this.element.ownerDocument.createElementNS(SVGNamespace, "g");
            this.element.insertBefore(this._state.groupElement, this.element.childNodes[this.firstSublayerNodeIndex]);
            ++this.firstSublayerNodeIndex;
            layer._drawInContext(this);
            if (this._stack.length > 0){
                throw new Error("Unbalanced save/restore");
            }
            this.needsCustomDisplay = false;
        }
        this._propertiesNeedingUpdate = {};
    },

    // ----------------------------------------------------------------------
    // MARK: - Background, Shadow, Border

    _needsBoundsPathsRedraw: true,

    _shadowPath: null,
    _shadowFilter: null,
    _shadowOffsetElement: null,
    _shadowBlurElement: null,
    _shadowColorElement: null,

    _backgroundIndex: 0,
    _backgroundGradientIndex: 0,

    _createShadowPathIfNeeded: function(layer){
        if (this._shadowPath === null){
            this._createShadowFilterIfNeeded(layer);
            this._shadowPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
            this._shadowPath.style.fill = 'black';
            this._shadowPath.style.filter = 'url(#%s)'.sprintf(this._shadowFilter.id);
            this.element.insertBefore(this._shadowPath, this.element.childNodes[0]);
            this._updateShadowPath(layer);
            ++this._backgroundIndex;
            ++this._backgroundGradientIndex;
            ++this.firstSublayerNodeIndex;
        }
    },

    _createShadowFilterIfNeeded: function(layer){
        if (this._shadowFilter === null){
            this._shadowFilter = this.element.ownerDocument.createElementNS(SVGNamespace, "filter");
            this._shadowFilter.id = this._uniqueIdPrefix + 'shadow';
            var size = layer.presentation.bounds.size;
            // Not clear why this throws a NotSupported error here, but not later
            // this._shadowFilter.x.baseVal.value = 0;
            // this._shadowFilter.y.baseVal.value = 0;
            // this._shadowFilter.width.baseVal.value = size.width;
            // this._shadowFilter.height.baseVal.value = size.height;
            this._shadowFilter.setAttribute("filterUnits", "objectBoundingBox");

            this._shadowOffsetElement = this.element.ownerDocument.createElementNS(SVGNamespace, "feOffset");
            this._shadowOffsetElement.setAttribute("in", "SourceAlpha");
            this._shadowOffsetElement.dx.baseVal = 0;
            this._shadowOffsetElement.dy.baseVal = 0;

            this._shadowBlurElement = this.element.ownerDocument.createElementNS(SVGNamespace, "feGaussianBlur");
            this._shadowBlurElement.setStdDeviation(0, 0);

            this._shadowColorElement = this.element.ownerDocument.createElementNS(SVGNamespace, "feColorMatrix");
            this._shadowColorElement.setAttribute("values", "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 0");
            this._shadowColorElement.setAttribute("type", "matrix");

            this._shadowFilter.appendChild(this._shadowOffsetElement);
            this._shadowFilter.appendChild(this._shadowBlurElement);
            this._shadowFilter.appendChild(this._shadowColorElement);
            this._definitionsElement.appendChild(this._shadowFilter);
        }
    },

    _updateShadowPath: function(layer){
        this._shadowPath.pathSegList.clear();
        this._currentPath = this._shadowPath;
        this.addBorderPathForLayerProperties(layer.presentation, UILayer.Path.shadow);
        this._currentPath = null;
    },

    _updateShadowFilterSize: function(layer){
        var radius = layer.presentation.shadowRadius;
        var size = layer.presentation.bounds.size;
        this._shadowFilter.x.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, -radius);
        this._shadowFilter.y.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, -radius);
        this._shadowFilter.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, size.width + radius + radius);
        this._shadowFilter.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_NUMBER, size.height + radius + radius);
    },

    _backgroundPath: null,
    _backgroundGradientPath: null,
    _backgroundGradient: null,

    _createBackgroundPathIfNeeded: function(layer){
        if (this._backgroundPath === null){
            this._backgroundPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
            this.element.insertBefore(this._backgroundPath, this.element.childNodes[this._backgroundIndex]);
            this._updateBackgroundPath(layer);
            ++this._backgroundGradientIndex;
            ++this.firstSublayerNodeIndex;
        }
    },

    _createBackgroundGradientPathIfNeeded: function(layer){
        if (this._backgroundGradientPath === null){
            this._backgroundGradientPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
            this.element.appendChild(this._backgroundGradientPath);
            this.element.insertBefore(this._backgroundPath, this.element.childNodes[this._backgroundGradientIndex]);
            this._updateBackgroundPath(layer);
        }
    },

    _createBackgroundGradientIfNecessary: function(layer){
        if (this._backgroundGradient === null){
            this._backgroundGradient = this.element.ownerDocument.createElementNS(SVGNamespace, "linearGradient");
            this._backgroundGradient.id = this._uniqueIdPrefix + 'backgroundGradient';
            this._definitionsElement.appendChild(this._backgroundGradient);
        }
    },

    _updateBackgroundPath: function(layer){
        if (this._backgroundPath !== null){
            this._backgroundPath.pathSegList.clear();
            this._currentPath = this._backgroundPath;
            this.addBorderPathForLayerProperties(layer.presentation, UILayer.Path.background);
            this._currentPath = null;
        }
        if (this._backgroundGradientPath !== null){
            this._backgroundGradientPath.pathSegList.clear();
            this._currentPath = this._backgroundGradientPath;
            this.addBorderPathForLayerProperties(layer.presentation, UILayer.Path.background);
            this._currentPath = null;
        }
    },

    _borderPath: null,

    _createBorderPathIfNeeded: function(layer){
        if (this._borderPath === null){
            this._borderPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
            this._borderPath.style.fill = 'none';
            this.element.appendChild(this._borderPath);
            this._updateBorderPath(layer);
        }
    },

    _updateBorderPath: function(layer){
        this._borderPath.pathSegList.clear();
        this._currentPath = this._borderPath;
        this.addBorderPathForLayerProperties(layer.presentation, UILayer.Path.border);
        this._currentPath = null;
    },

    // ----------------------------------------------------------------------
    // MARK: - SVG Layer Shortcuts

    _propertiesNeedingUpdate: null,

    updateSVG_bounds: function(layer){
        var size = layer.presentation.bounds.size;
        if (this._shadowFilter !== null){
            this._updateShadowFilterSize(layer);
        }
    },

    updateSVG_origin: function(){

    },

    updateSVG_transform: function(layer){
        var transform = layer.presentation.transform;
        var l = this.element.transform.baseVal.numberOfItems;
        if (transform.isIdentity){
            --l;
            // remove all but first item (this.originTransform)
            while (l > 0){
                this.element.transform.baseVal.removeItem(l);
                --l;
            }
        }else{
            var anchorPoint = JSPoint(layer.presentation.anchorPoint.x * layer.presentation.bounds.width, layer.presentation.anchorPoint.y * layer.presentation.bounds.height);
            var t1;
            var t2;
            var t3;
            var matrix = this.element.ownerSVGElement.createSVGMatrix();
            matrix.a = transform.a;
            matrix.b = transform.b;
            matrix.c = transform.c;
            matrix.d = transform.d;
            matrix.e = transform.tx;
            matrix.f = transform.ty;
            if (l == 1){
                t1 = this.element.ownerSVGElement.createSVGTransform();
                t2 = this.element.ownerSVGElement.createSVGTransform();
                t3 = this.element.ownerSVGElement.createSVGTransform();
                this.element.transform.baseVal.appendItem(t1);
                this.element.transform.baseVal.appendItem(t2);
                this.element.transform.baseVal.appendItem(t3);
            }else{
                t1 = this.element.transform.baseVal.getItem(1);
                t2 = this.element.transform.baseVal.getItem(2);
                t3 = this.element.transform.baseVal.getItem(3);
            }
            t1.setTranslate(anchorPoint.x, anchorPoint.y);
            t2.setMatrix(matrix);
            t3.setTranslate(-anchorPoint.x, -anchorPoint.y);
        }
    },

    updateSVG_hidden: function(layer){
        this.element.style.visibility = layer.presentation.hidden ? 'hidden' : '';
    },

    updateSVG_clipsToBounds: function(layer){
        // TODO: clip contents, but not shadow
    },

    updateSVG_alpha: function(layer){
        this.element.style.opacity = layer.presentation.alpha != 1.0 ? layer.presentation.alpha : '';
    },

    updateSVG_background: function(layer){
        var color = layer.presentation.backgroundColor;
        if (color !== null){
            this._createBackgroundPathIfNeeded(layer);
            this._backgroundPath.style.fill = color.cssString();
        }else if (this._backgroundPath !== null){
            this._backgroundPath.style.fill = 'none';
        }

        var gradient = layer.presentation.backgroundGradient;
        if (gradient !== null){
            this._createBackgroundGradientPathIfNeeded(layer);
            this._createBackgroundGradientIfNecessary(layer);
            this._backgroundGradient.x1.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, gradient.start.x * 100);
            this._backgroundGradient.y1.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, gradient.start.y * 100);
            this._backgroundGradient.x2.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, gradient.end.x * 100);
            this._backgroundGradient.y2.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, gradient.end.y * 100);
            var existingStopCount = this._backgroundGradient.childNodes.length;
            var stop;
            var i = 0;
            for (var position in gradient.stops){
                color = gradient.stops[position];
                if (i < existingStopCount){
                    stop = this._backgroundGradient.childNodes[i];
                }else{
                    stop = this.element.ownerDocument.createElementNS(SVGNamespace, "stop");
                    this._backgroundGradient.appendChild(stop);
                }
                stop.offset.baseVal = position;
                stop.style.stopColor = color.cssString();
                ++i;
            }
            for (var j = existingStopCount - 1; j >= i; --j){
                this._backgroundGradient.removeChild(this._backgroundGradient.childNodes[j]);
            }
            this._backgroundGradientPath.style.fill = 'url(#%s)'.sprintf(this._backgroundGradient.id);
        }else if (this._backgroundGradientPath !== null){
            this._backgroundGradientPath.fill = 'none';
        }
    },

    updateSVG_borderColor: function(layer){
        var color = layer.presentation.borderColor;
        if (color !== null){
            this._createBorderPathIfNeeded(layer);
            this._borderPath.style.stroke = color.cssString();
        }else if (this._borderPath !== null){
            this._borderPath.style.stroke = 'none';
        }
    },

    updateSVG_borderWidth: function(layer){
        var width = layer.presentation.borderWidth;
        if (width > 0){
            this._createBorderPathIfNeeded(layer);
            this._borderPath.style.strokeWidth = width;
        }else if (this._borderPath !== null){
            this._borderPath.style.strokeWidth = '0';
        }
    },

    updateSVG_shadowColor: function(layer){
        var color = layer.presentation.shadowColor;
        if (color === null){
            if (this._shadowPath !== null){
                this._shadowPath.parentNode.removeChild(this._shadowPath);
                this._shadowPath = null;
            }
        }else{
            this._createShadowPathIfNeeded(layer);
            var rgba = color.rgbaColor();
            var r = this.element.ownerSVGElement.createSVGNumber();
            var g = this.element.ownerSVGElement.createSVGNumber();
            var b = this.element.ownerSVGElement.createSVGNumber();
            var a = this.element.ownerSVGElement.createSVGNumber();
            r.value = rgba.red;
            g.value = rgba.green;
            b.value = rgba.blue;
            a.value = rgba.alpha;
            this._shadowColorElement.values.baseVal.replaceItem(r, 4);
            this._shadowColorElement.values.baseVal.replaceItem(g, 9);
            this._shadowColorElement.values.baseVal.replaceItem(b, 14);
            this._shadowColorElement.values.baseVal.replaceItem(a, 18);
        }
    },

    updateSVG_shadowOffset: function(layer){
        if (layer.presentation.shadowColor !== null){
            this._createShadowFilterIfNeeded(layer);
        }
        if (this._shadowOffsetElement !== null){
            var offset = layer.presentation.shadowOffset;
            this._shadowOffsetElement.dx.baseVal = offset.x;
            this._shadowOffsetElement.dy.baseVal = offset.y;
        }
    },

    updateSVG_shadowRadius: function(layer){
        if (layer.presentation.shadowColor !== null){
            this._createShadowFilterIfNeeded(layer);
        }
        if (this._shadowBlurElement !== null){
            var radius = layer.presentation.shadowRadius;
            this._shadowBlurElement.setStdDeviation(radius / 2, radius / 2);
            this._updateShadowFilterSize(layer);
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Tracking

    trackingElement: null,
    trackingListener: null,

    startMouseTracking: function(trackingType, listener){
        // TODO:

        // if (this.trackingElement === null){
        //     this.trackingElement = this.element.ownerDocument.createElement('div');
        //     this.trackingElement.style.position = 'absolute';
        //     this.trackingElement.style.top = '0';
        //     this.trackingElement.style.left = '0';
        //     this.trackingElement.style.bottom = '0';
        //     this.trackingElement.style.right = '0';
        //     this.trackingElement.dataset.tag = "tracking";
        //     this.element.appendChild(this.trackingElement);
        // }else if (this.trackingListener !== null){
        //     this.trackingElement.removeEventListener('mouseenter', this.trackingListener);
        //     this.trackingElement.removeEventListener('mouseleave', this.trackingListener);
        //     this.trackingElement.removeEventListener('mousemove', this.trackingListener);
        // }
        // this.trackingListener = listener;
        // if (trackingType & UIView.MouseTracking.enterAndExit){
        //     this.trackingElement.addEventListener('mouseenter', this.trackingListener);
        //     this.trackingElement.addEventListener('mouseleave', this.trackingListener);
        // }
        // if (trackingType & UIView.MouseTracking.move){
        //     this.trackingElement.addEventListener('mousemove', this.trackingListener);
        // }
    },

    stopMouseTracking: function(){
        if (this.trackingElement === null || this.trackingListener === null){
            return;
        }
        this.trackingElement.removeEventListener('mouseenter', this.trackingListener);
        this.trackingElement.removeEventListener('mouseleave', this.trackingListener);
        this.trackingElement.removeEventListener('mousemove', this.trackingListener);
        this.trackingElement.parentNode.removeChild(this.trackingElement);
        this.trackingElement = null;
        this.trackingListener = null;
    },

    // ----------------------------------------------------------------------
    // MARK: - Constructing Paths

    _currentPath: null,

    beginPath: function(){
        UIHTMLDisplayServerSVGContext.$super.beginPath.call(this);
        this._currentPath = this.element.ownerDocument.createElementNS(SVGNamespace, "path");
    },

    _discardPath: function(){
        UIHTMLDisplayServerSVGContext.$super._discardPath.call(this);
        this._currentPath = null;
    },

    moveToPoint: function(x, y){
        if (!this._currentPath){
            this.beginPath();
        }
        UIHTMLDisplayServerSVGContext.$super.moveToPoint.call(this, x, y);
        var seg = this._currentPath.createSVGPathSegMovetoAbs(x, y);
        this._currentPath.pathSegList.appendItem(seg);
    },

    addLineToPoint: function(x, y){
        if (!this._currentPath){
            this.beginPath();
        }
        UIHTMLDisplayServerSVGContext.$super.addLineToPoint.call(this, x, y);
        var seg = this._currentPath.createSVGPathSegLinetoAbs(x, y);
        this._currentPath.pathSegList.appendItem(seg);
    },

    addCurveToPoint: function(point, control1, control2){
        if (!this._currentPath){
            this.beginPath();
        }
        UIHTMLDisplayServerSVGContext.$super.addCurveToPoint.call(this, point, control1, control2);
        var seg = this._currentPath.createSVGPathSegCurvetoCubicAbs(point.x, point.y, control1.x, control1.y, control2.x, control2.y);
        this._currentPath.pathSegList.appendItem(seg);
    },

    addQuadraticCurveToPoint: function(point, control){
        if (!this._currentPath){
            this.beginPath();
        }
        UIHTMLDisplayServerSVGContext.$super.addQuadraticCurveToPoint.call(this, point, control);
        var seg = this._currentPath.createSVGPathSegCurvetoQuadraticAbs(point.x, point.y, control.x, control.y);
        this._currentPath.pathSegList.appendItem(seg);
    },

    closePath: function(){
        if (!this._currentPath){
            this.beginPath();
        }
        UIHTMLDisplayServerSVGContext.$super.closePath.call(this);
        var seg = this._currentPath.createSVGPathSegClosePath();
        this._currentPath.pathSegList.appendItem(seg);
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing the Current Path

    drawPath: function(drawingMode){
        if (!this._currentPath){
            this.beginPath();
        }
        switch (drawingMode){
            case JSContext.DrawingMode.fill:
                this._styleElementForFill(this._currentPath, JSContext.FillRule.winding);
                break;
            case JSContext.DrawingMode.evenOddFill:
                this._styleElementForFill(this._currentPath, JSContext.FillRule.evenOdd);
                break;
            case JSContext.DrawingMode.stroke:
                this._styleElementForStroke(this._currentPath);
                break;
            case JSContext.DrawingMode.fillStroke:
                // style stroke first because it sets fill to none, then override with fill
                // NOTE: the stroke will still be painted on top of the fill
                this._styleElementForStroke(this._currentPath);
                this._styleElementForFill(this._currentPath, JSContext.FillRule.winding);
                break;
            case JSContext.DrawingMode.evenOddFillStroke:
                this._styleElementForStroke(this._currentPath);
                this._styleElementForFill(this._currentPath, JSContext.FillRule.evenOdd);
                break;
        }
        this._state.groupElement.appendChild(this._currentPath);
        this._discardPath();
    },

    fillPath: function(fillRule){
        if (!this._currentPath){
            this.beginPath();
        }
        this._styleElementForFill(this._currentPath, fillRule);
        this._state.groupElement.appendChild(this._currentPath);
        this._discardPath();
    },

    strokePath: function(){
        if (!this._currentPath){
            this.beginPath();
        }
        this._styleElementForStroke(this._currentPath);
        this._state.groupElement.appendChild(this._currentPath);
        this._discardPath();
    },

    _styleElementForFill: function(element, fillRule){
        var color = this._state.fillColor;
        element.style.fill = color ? color.cssString() : '';
        if (fillRule == JSContext.FillRule.evenOdd){
            element.style.fillRule = 'evenodd';
        }
        if (this._state.clipPath){
            element.style.clipPath = 'url(#%s)'.sprintf(this._state.clipPath.id);
        }
    },

    _styleElementForStroke: function(element){
        element.style.fill = 'none';
        if (this._state.lineWidth === 0){
            return;
        }
        var color = this._state.strokeColor;
        element.style.stroke = color ? color.cssString() : '';
        element.style.strokeWidth = this._state.lineWidth;
        if (this._state.lineCap !== JSContext.LineCap.butt){
            element.style.strokeLinecap = this._state.lineCap;
        }
        if (this._state.lineJoin !== JSContext.LineJoin.miter){
            element.style.strokeLinejoin = this._state.lineJoin;
        }
        if (this._state.miterLimit !== 4){
            element.style.strokeMiterlimit = this._state.miterLimit;
        }
        if (this._state.lineDash.lengths.length > 0){
            element.style.strokeDasharray = this._state.lineDash.join(',');
            if (this._state.lineDash.phase !== 0){
                element.style.strokeDashoffset = this._state.lineDash.phase;
            }
        }
        if (this._state.clipPath){
            element.style.clipPath = 'url(#%s)'.sprintf(this._state.clipPath.id);
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Shapes

    clearRect: function(rect){
        // clip?
    },

    fillRect: function(rect){
        var svgRect = this.element.ownerDocument.createElementNS(SVGNamespace, "rect");
        svgRect.x.baseVal.value = rect.origin.x;
        svgRect.y.baseVal.value = rect.origin.y;
        svgRect.width.baseVal.value = rect.size.width;
        svgRect.height.baseVal.value = rect.size.height;
        this._styleElementForFill(svgRect);
        this._state.groupElement.appendChild(svgRect);
        this._discardPath();
    },

    strokeRect: function(rect){
        var svgRect = this.element.ownerDocument.createElementNS(SVGNamespace, "rect");
        svgRect.x.baseVal.value = rect.origin.x;
        svgRect.y.baseVal.value = rect.origin.y;
        svgRect.width.baseVal.value = rect.size.width;
        svgRect.height.baseVal.value = rect.size.height;
        this._styleElementForStroke(svgRect);
        this._state.groupElement.appendChild(svgRect);
        this._discardPath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Images

    drawImage: function(image, rect){
        var caps = image.capInsets;
        if (caps !== null){
            // TODO: stretchable images
        }else{
            var svgImage = this.element.ownerDocument.createElementNS(SVGNamespace, "image");
            svgImage.x.baseVal.value = rect.origin.x;
            svgImage.y.baseVal.value = rect.origin.y;
            svgImage.width.baseVal.value = rect.size.width;
            svgImage.height.baseVal.value = rect.size.height;
            svgImage.setAttribute("preserveAspectRatio", "none");
            var url = image.htmlURLString();
            svgImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
            if (image.templateColor){
                this._createImageMaskFilterIfNeeded();
                svgImage.style.filter = 'url(#%s)'.sprintf(this._imageMaskFilter.id);
                var mask = this._dequeueImageMask();
                mask.appendChild(svgImage);
                var svgRect = this.element.ownerDocument.createElementNS(SVGNamespace, "rect");
                svgRect.x.baseVal.value = rect.origin.x;
                svgRect.y.baseVal.value = rect.origin.y;
                svgRect.width.baseVal.value = rect.size.width;
                svgRect.height.baseVal.value = rect.size.height;
                svgRect.style.fill = image.templateColor.cssString();
                svgRect.style.mask = 'url(#%s)'.sprintf(mask.id);
                this._state.groupElement.appendChild(svgRect);
            }else{
                this._state.groupElement.appendChild(svgImage);
            }
        }
    },

    _imageMaskFilter: null,
    _imageMasks: null,
    _imageMaskIndex: 0,

    _createImageMaskFilterIfNeeded: function(layer){
        if (this._imageMaskFilter === null){
            var filter = this.element.ownerDocument.createElementNS(SVGNamespace, "filter");
            filter.id = this._uniqueIdPrefix + "imageMaskFilter";
            var colorMatrix = this.element.ownerDocument.createElementNS(SVGNamespace, "feColorMatrix");
            colorMatrix.setAttribute("in", "SourceAlpha");
            colorMatrix.setAttribute("type", "matrix");
            colorMatrix.setAttribute("values", "0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0");
            filter.appendChild(colorMatrix);
            this._definitionsElement.appendChild(filter);
            this._imageMaskFilter = filter;
        }
    },

    _dequeueImageMask: function(){
        var mask;
        if (this._imageMaskIndex < this._imageMasks.length){
            mask = this._imageMasks[this._imageMaskIndex];
            mask.removeChild(mask.childNodes[0]);
        }else{
            mask = this.element.ownerDocument.createElementNS(SVGNamespace, "mask");
            mask.id = this._uniqueIdPrefix + "imageMask-" + this._imageMasks.length;
            this._definitionsElement.appendChild(mask);
        }
        ++this._imageMaskIndex;
        return mask;
    },

    // ----------------------------------------------------------------------
    // MARK: - Gradients

    drawLinearGradient: function(gradient, start, end){
        // TODO
    },

    drawRadialGradient: function(gradient, startCenter, startRadius, endCenter, endRadius){
        // TODO
    },

    // ----------------------------------------------------------------------
    // MARK: - Text

    setFont: function(font){
        this._state.font = font;
    },

    setCharacterSpacing: function(spacing){
        this._state.characterSpacing = spacing;
    },

    setTextMatrix: function(textMatrix){
        this._state.textMatrix = textMatrix;
    },

    setTextDrawingMode: function(textDrawingMode){
        this._state.textDrawingMode = textDrawingMode;
    },

    showGlyphs: function(glyphs){
        var text = this._state.font.stringForGlyphs(glyphs);
        this.showText(text);
    },

    showText: function(text){
        var textElement = this.element.ownerDocument.createElementNS(SVGNamespace, "text");
        var tspanElement = this.element.ownerDocument.createElementNS(SVGNamespace, "tspan");
        var matrix = this.element.ownerSVGElement.createSVGMatrix();
        matrix.a = this._state.textMatrix.a;
        matrix.b = this._state.textMatrix.b;
        matrix.c = this._state.textMatrix.c;
        matrix.d = this._state.textMatrix.d;
        matrix.e = this._state.textMatrix.tx;
        matrix.f = this._state.textMatrix.ty;
        var transform = this.element.ownerSVGElement.createSVGTransform();
        transform.setMatrix(matrix);
        textElement.transform.baseVal.appendItem(transform);
        textElement.style.font = this._state.font.cssString();
        textElement.style.kerning = "0";
        switch (this._state.textDrawingMode){
            case JSContext.TextDrawingMode.fill:
                textElement.style.fill = this._state.fillColor.cssString();
                break;
            case JSContext.TextDrawingMode.stroke:
                textElement.style.fill = 'none';
                textElement.style.strokeWidth = this._state.lineWidth / Math.abs(this._state.textMatrix.d);
                textElement.style.stroke = this._state.strokeColor.cssString();
                break;
            case JSContext.TextDrawingMode.fillStroke:
                textElement.style.fill = this._state.fillColor.cssString();
                textElement.style.strokeWidth = this._state.lineWidth / Math.abs(this._state.textMatrix.d);
                textElement.style.stroke = this._state.strokeColor.cssString();
                break;
        }
        if (this._state.characterSpacing !== 0){
            textElement.style.letterSpacing = "%0.2f".sprintf(this._state.characterSpacing);
        }
        tspanElement.appendChild(this.element.ownerDocument.createTextNode(text));
        textElement.appendChild(tspanElement);
        this._state.groupElement.appendChild(textElement);
    },

    addExternalElementInRect: function(element, rect){
        element.style.position = 'relative';
        var foreignObject = this.element.ownerDocument.createElementNS(SVGNamespace, "foreignObject");
        foreignObject.x.baseVal.value = rect.origin.x;
        foreignObject.y.baseVal.value = rect.origin.y;
        foreignObject.width.baseVal.value = rect.size.width;
        foreignObject.height.baseVal.value = rect.size.height;
        foreignObject.appendChild(element);
        this._state.groupElement.appendChild(foreignObject);
    },

    // ----------------------------------------------------------------------
    // MARK: - Fill, Stroke, Shadow Colors

    getAlpha: function(){
        return this._state.alpha;
    },

    setAlpha: function(alpha){
        this._state.alpha = alpha;
    },

    setFillColor: function(fillColor){
        this._state.fillColor = fillColor;
    },

    setStrokeColor: function(strokeColor){
        this._state.strokeColor = strokeColor;
    },

    setShadow: function(offset, blur, color){
        // TODO:
    },

    // ----------------------------------------------------------------------
    // MARK: - Clipping

    _clipPathID: 0,

    clip: function(fillRule){
        // FIXME: needs to consider all clips on the state stack, combined with fillRule
        // this._state.clipPath = this.element.ownerDocument.createElementNS(SVGNamespace, "clipPath");
        // ++this._clipPathID;
        // this._state.clipPath.id = this._uniqueIdPrefix + "clip-" + this._clipPathID;
        // this._state.clipPath.appendChild(this._currentPath);
        // this._currentPath.style.fill = 'black';
        // this._definitionsElement.appendChild(this._state.clipPath);
        this._discardPath();
    },

    // ----------------------------------------------------------------------
    // MARK: - Transformations

    scaleBy: function(sx, sy){
        var svgTransform = this.element.ownerSVGElement.createSVGTransform();
        svgTransform.setScale(sx, sy);
        this._addTransform(svgTransform);
    },

    rotateBy: function(angle){
        var svgTransform = this.element.ownerSVGElement.createSVGTransform();
        svgTransform.setRotate(angle);
        this._addTransform(svgTransform);
    },

    translateBy: function(tx, ty){
        var svgTransform = this.element.ownerSVGElement.createSVGTransform();
        svgTransform.setTranslate(tx, ty);
        this._addTransform(svgTransform);
    },

    concatenate: function(transform){
        var svgMatrix = this.element.ownerSVGElement.createSVGMatrix();
        svgMatrix.a = transform.a;
        svgMatrix.b = transform.b;
        svgMatrix.c = transform.c;
        svgMatrix.d = transform.d;
        svgMatrix.e = transform.tx;
        svgMatrix.f = transform.ty;
        var svgTransform = this.element.ownerSVGElement.createSVGTransformFromMatrix(svgMatrix);
        this._addTransform(svgTransform);
    },

    _addTransform: function(svgTransform){
        var group = this.element.ownerDocument.createElementNS(SVGNamespace, "g");
        group.transform.baseVal.initialize(svgTransform);
        this._state.groupElement.appendChild(group);
        this._state.groupElement = group;
    },

    // ----------------------------------------------------------------------
    // MARK: - Drawing Options

    setLineWidth: function(lineWidth){
        this._state.lineWidth = lineWidth;
    },

    setLineCap: function(lineCap){
        this._state.lineCap = lineCap;
    },

    setLineJoin: function(lineJoin){
        this._state.lineJoin = lineJoin;
    },

    setMiterLimit: function(miterLimit){
        this._state.miterLimit = miterLimit;
    },

    setLineDash: function(phase, lengths){
        this._state.lineDash = {phase: phase, lengths: lengths};
    },

    // ----------------------------------------------------------------------
    // MARK: - Graphics State

    _state: null,
    _stack: null,

    save: function(){
        var newState = Object.create(this._state);
        this._stack.push(this._state);
        this._state = newState;
    },

    restore: function(){
        if (this._stack.length > 0){
            this._state = this._stack.pop();
        }
    }

});

var SVGNamespace = "http://www.w3.org/2000/svg";

var State = {
    alpha: 1,
    transform: JSAffineTransform.Identity,
    clipPath: null,
    fillColor: JSColor.blackColor,
    strokeColor: JSColor.blackColor,
    lineWidth: 1,
    lineCap: JSContext.LineCap.butt,
    lineJoin: JSContext.LineJoin.miter,
    miterLimit: 10,
    lineDash: {phase: 0, lengths: []},
    shadowOffset: JSPoint.Zero,
    shadowBlur: 0,
    shadowColor: null,
    font: null,
    textMatrix: JSAffineTransform.Identity,
    textDrawingMode: JSContext.TextDrawingMode.fill,
    characterSpacing: 0,
    groupElement: null
};

})();