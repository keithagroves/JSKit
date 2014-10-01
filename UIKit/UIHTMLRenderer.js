// #import "UIKit/UIRenderer.js"
// #import "UIKit/UIHTMLRendererContext.js"

JSClass("UIHTMLRenderer", UIRenderer, {

    domWindow: null,
    domDocument: null,
    rootElement: null,
    rootLayer: null,
    environmentSize: null,
    domEventMethodMap: {
        'mousedown'     : 'mouseDown',
        'mouseup'       : 'mouseUp',
        'mousemove'     : 'mouseMoved',
        'mouseover'     : 'mouseEntered',
        'mouseout'      : 'mouseExited'
    },

    initWithRootElement: function(rootElement){
        this.rootElement = rootElement;
        this.domDocument = this.rootElement.ownerDocument;
        this.domWindow = this.domDocument.defaultView;
        this.rootLayer = null;
    },

    setupRenderingEnvironment: function(){
        this.rootElement._UIRendererContext = UIHTMLRendererContext.initWithElement(this.rootElement);
        this.rootElement.style = 'relative';
        if (this.rootElement === this.domDocument.body){
            var body = this.rootElement;
            var html = this.domDocument.documentElement;
            body.style.padding = '0';
            html.style.padding = '0';
            body.style.margin = '0';
            html.style.margin = '0';
            body.style.height = '100%';
            html.style.height = '100%';
        }else{
            var style = this.domWindow.getComputedStyle(this.rootElement);
            if (style.position != 'absolute' && style.position != 'relative'){
                this.rootElement.style.position = 'relative';
            }
        }
        this.determineEnvironmentSize();
        this.domWindow.addEventListener('resize', this, false);
    },

    determineEnvironmentSize: function(){
        this.environmentSize = JSSize(this.rootElement.offsetWidth, this.rootElement.offsetWidth);
    },

    viewInserted: function(view){
        var element = this.elementForLayer(view.layer);
        if (element){
            var context = element._UIRendererContext;
            for (var eventType in this.domEventMethodMap){
                if (this.domEventMethodMap[eventType] in view){
                    element.addEventListener(eventType, this, false);
                    context.view = view;
                }
            }
            for (var i = 0, l = view.subviews.length; i < l; ++i){
                this.viewInserted(view.subviews[i]);
            }
        }
    },

    viewRemoved: function(view){
    },

    layerInserted: function(layer){
        var parentElement;
        if (layer.superlayer){
            parentElement = this.elementForLayer(layer.superlayer);
        }else{
            parentElement = this.rootElement;
            this.rootLayer = layer;
        }
        if (parentElement){
            var element = this.domDocument.createElement('div');
            var context = element._UIRendererContext = UIHTMLRendererContext.initWithElement(element);
            if (layer.isKindOfClass(UIScrollLayer)){
                var sizer = element.appendChild(this.domDocument.createElement('div'));
                element.style.position = 'relative';
                sizer.style.position = 'absolute';
                sizer.style.top = '0px';
                sizer.style.left = '0px';
                sizer.style.width = '0px';
                sizer.style.height = '0px';
                context.scrollContentSizer = sizer;
            }else if (layer.isKindOfClass(UITextLayer)){
                context.textNode = element.appendChild(this.domDocument.createTextNode(''));
            }
            context.firstSublayerNodeIndex = element.childNodes.length;
            element.style.position = 'absolute'; // TODO: allow other layout strategies
            element.style.boxSizing = 'border-box';
            element.style.mozBoxSizing = 'border-box';
            element.style.borderStyle = 'solid'; // TODO: allow other border styles
            element.setAttribute('UIViewClass', view.$class.className);
            element.id = 'UILayer-' + layer.objectID;
            var insertIndex = parentElement._UIRendererContext.firstSublayerNodeIndex + layer.level;
            if (insertIndex < parentElement.childNodes.length){
                parentElement.insertBefore(element, parentElement.childNodes[insertIndex]);
            }else{
                parentElement.appendChild(element);
            }
            for (var i = 0, l = layer.sublayers.length; i < l; ++i){
                this.layerInserted(layer.sublayers[i]);
            }
            this.updateLayer(layer);
        }
    },

    layerRemoved: function(layer){
        var element = this.elementForLayer(layer);
        if (element){
            element.parentNode.removeChild(element);
            var context = element._UIRendererContext;
            context.destroy();
            element._UIRendererContext = null;
        }
    },

    setLayerNeedsRenderForKey: function(layer, key){
        if (key === 'superlayer.frame.size'){
            // superlayer.frame.size is a special key used when the superlayer of a
            // layer with a constraint box changes its frame size, affecting the sublayer's
            // layout based on the constraints specified on the sublayer and the new size.
            // Because of the way we assign CSS positional styles for a constraint box,
            // specifically that CSS already does the exact same calculation we do,
            // There's no CSS that needs to change in this case, so we won't queue anything.
            return;
        }
        if (key == 'shadowColor' || key == 'shadowOffset' || key == 'shadowRadius'){
            // Because the boxShadow property in CSS is a single property, and the combination
            // of several UILayer properties, we'll treat any shadow-related property as the same
            // thing so only one update gets queued.
            key = 'shadow';
        }
        if (key == 'frame' || key == 'position' || key == 'constraintBox'){
            // Changes to any of these UILayer properties triggers the same CSS updates, so
            // we'll treat them as the same thing so only one update gets queued.
            key = 'box';
        }
        UIHTMLRenderer.$super.setLayerNeedsRenderForKey.call(this, layer, key);
    },

    layerPropertyRenderer: {

        box: function (layer, context){
            var box = layer.properties.constraintBox;
            if (!box){
                box = JSConstraintBox.Rect(layer.properties.frame);
            }
            for (var property in box){
                if (box[property] === undefined){
                    context.style[property] = '';
                }else{
                    context.style[property] = box[property] + 'px';
                }
            }
            if (box.left === undefined && box.right === undefined){
                var width = box.width;
                if (width === undefined){
                    width = layer.properties.frame.size.width;
                }
                context.style.left = '50%';
                context.style.marginLeft = (-width) + 'px';
            }else{
                context.style.marginLeft = '';
            }
            if (box.top === undefined && box.bottom === undefined){
                var height = box.height;
                if (height === undefined){
                    height = layer.properties.frame.size.height;
                }
                context.style.top = '50%';
                context.style.marginTop = (-height) + 'px';
            }else{
                context.style.marginTop = '';
            }
            if (context.canvas){
                // TODO: size canvas
            }
        },

        'frame.origin.x': function(layer, context){
            context.style.left = layer.properties.frame.origin.x + 'px';
        },

        'frame.origin.y': function(layer, context){
            context.style.top = layer.properties.frame.origin.y + 'px';
        },

        'frame.size.width': function(layer, context){
            context.style.width = layer.properties.frame.size.width + 'px';
            if (context.canvas){
                // TODO: size canvas
            }
        },

        'frame.size.height': function(layer, context){
            context.style.height = layer.properties.frame.size.height + 'px';
            if (context.canvas){
                // TODO: size canvas
            }
        },

        'constraintBox.top': function(layer, context){
            context.style.top = layer.properties.constraintBox.top + 'px';
        },

        'constraintBox.right': function(layer, context){
            context.style.right = layer.properties.constraintBox.right + 'px';
        },

        'constraintBox.bottom': function(layer, context){
            context.style.bottom = layer.properties.constraintBox.bottom + 'px';
        },

        'constraintBox.left': function(layer, context){
            context.style.left = layer.properties.constraintBox.left + 'px';
        },

        'constraintBox.width': function(layer, context){
            context.style.width = layer.properties.constraintBox.width + 'px';
            if (context.canvas){
                // TODO: size canvas
            }
        },

        'constraintBox.height': function(layer, context){
            context.style.height = layer.properties.constraintBox.height + 'px';
            if (context.canvas){
                // TODO: size canvas
            }
        },

        hidden: function(layer, context){
            context.style.display = layer.properties.hidden ? 'none' : '';
        },

        opacity: function(layer, context){
            context.style.opacity = layer.properties.opacity != 1.0 ? layer.properties.opacity : '';
        },

        backgroundColor: function(layer, context){
            context.style.backgroundColor = layer.properties.backgroundColor ? layer.properties.backgroundColor.cssString() : '';
        },

        borderColor: function(layer, context){
            context.style.borderColor = layer.properties.borderColor ? layer.properties.borderColor.cssString() : '';
        },

        borderWidth: function(layer, context){
            context.style.borderWidth = layer.properties.borderWidth ? layer.properties.borderWidth + 'px' : '';
        },

        borderRadius: function(layer, context){
            context.style.borderRadius = layer.properties.borderRadius ? layer.properties.borderRadius + 'px' : '';
        },

        shadow: function(layer, context){
            if (layer.shadowColor){
                context.style.boxShadow = '%fpx %fpx %fpx %s'.sprintf(layer.shadowOffset.x, layer.shadowOffset.y, layer.shadowRadius, layer.shadowColor.cssString());
            }else{
                context.style.boxShadow = '';
            }
        },

        transform: function(layer, context){
            var transform = layer.properties.transform;
            if (transform){
                context.style.webkitTransform = context.style.MozTransform = 'matrix(%f, %f, %f, %f, %f, %f)'.sprintf(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
            }else{
                context.style.webkitTransform = context.style.MozTransform = '';
            }
        },

        text: function(layer, context){
            context.textNode.value = layer.text;
        },

        textColor: function(layer, context){
            context.style.color = layer.properties.textColor ? layer.properties.textColor.cssString() : '';
        },

        contentSize: function(layer, context){
            context.scrollContentSizer.style.width = layer.properties.contentSize.width + 'px';
            context.scrollContentSizer.style.height = layer.properties.contentSize.height + 'px';
        },

        contentOffset: function(layer, context){
            context.element.scrollLeft = layer.properties.contentOffset.x;
            context.element.scrollTop = layer.properties.contentOffset.y;
        }

    },

    elementForLayer: function(layer){
        return this.domDocument.getElementById('UILayer-' + layer.objectID);
    },

    contextForLayer: function(layer){
        return this.domDocument.getElementById('UILayer-' + layer.objectID)._UIRendererContext;
    },

    handleEvent: function(domEvent){
        if (domEvent.type == 'resize' && domEvent.currentTarget === this.domWindow){
            this.determineEnvironmentSize();
            if (this.rootLayer.constraintBox){
                this.rootLayer._updateFrameAfterSuperSizeChange(this.environmentSize);
            }
        }else{
            var element = domEvent.currentTarget;
            var context = element._UIRendererContext;
            var methodName = this.domEventMethodMap[domEvent.type.lower()];
            var event = UIEvent.init();
            context.view[methodName](event);
            domEvent.stopPropagation();
        }
    },

    requestDisplayFrame: function(){
        if (!this.displayFrameID){
            this.displayFrameID = this.domWindow.requestAnimationFrame(this._displayFrameBound);
        }
    }

});