// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import "UIView.js"
// #import "UIButton.js"
// #import "UIToolbarItem.js"
/* global UIMenu, UIPopupButton */
'use strict';

(function(){

JSClass("UIToolbar", UIView, {

    // --------------------------------------------------------------------
    // MARK: - Creating a Toolbar

    init: function(){
        var styler = UIToolbar.Styler.default;
        this.initWithStyler(styler);
    },

    initWithStyler: function(styler){
        this._items = [];
        this._imageSize = UIToolbar.ImageSize.default;
        this._styler = styler;
        this.stylerProperties = {};
        this._styler.initializeToolbar(this);
    },

    initWithSpec: function(spec){
        UIToolbar.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("styler")){
            this._styler = spec.valueForKey("styler", UIToolbarStyler);
        }else{
            this._styler = UIToolbar.Styler.default;
        }
        this.stylerProperties = {};
        this._styler.initializeToolbar(this);
        this._items = [];
        var item;
        if (spec.containsKey('imageSize')){
            this._imageSize = spec.valueForKey("imageSize", UIToolbar.ImageSize);
        }else{
            this._imageSize = UIToolbar.ImageSize.default;
        }
        if (spec.containsKey("showsTitles")){
            this._showsTitles = spec.valueForKey("showsTitles");
        }
        if (spec.containsKey('items')){
            var items = spec.valueForKey("items");
            for (var i = 0, l = items.length; i < l; ++i){
                item = items.valueForKey(i, UIToolbarItem);
                this.addItem(item);
            }
        }
    },

    styler: JSReadOnlyProperty('_styler', null),
    stylerProperties: null,

    // --------------------------------------------------------------------
    // MARK: - Item Management

    items: JSDynamicProperty('_items', null),

    setItems: function(items){
        var i, l;
        for (i = this._items.length; i >= 0; --i){
            this.removeItemAtIndex(i);
        }
        for (i = 0, l = items.length; i < l; ++i){
            this.addItem(items[i]);
        }
        this._styler.updateToolbar(this);
    },

    addItem: function(item){
        this.addItemAtIndex(item, this._items.length);
    },

    addItemAtIndex: function(item, index){
        item.toolbar = this;
        this._items.splice(index, 0, item);
        this._styler.updateToolbar(this);
    },

    removeItem: function(item){
        var index = this._items.indexOf(item);
        if (index >= 0){
            this.removeItemAtIndex(index);
        }
    },

    removeItemAtIndex: function(index){
        var item = this._items[index];
        item.toolbar = null;
        this._items.splice(index, 1);
        this._styler.updateToolbar(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Display Options

    showsTitles: JSDynamicProperty('_showsTitles', false),

    setShowsTitles: function(showsTitles){
        this._showsTitles = showsTitles;
        this._styler.updateToolbar();
    },

    imageSize: JSDynamicProperty('_imageSize', 0),

    setImageSize: function(imageSize){
        this._imageSize = imageSize;
        this._styler.updateToolbar(this);
    },

    // --------------------------------------------------------------------
    // MARK: - Window

    isWindowsMainToolbar: function(){
        return this.window && this.window.toolbar === this;
    },

    // --------------------------------------------------------------------
    // MARK: - Validation

    validateItems: function(){
        var item;
        for (var i = 0, l = this._items.length; i < l; ++i){
            item = this._items[i];
            item.validate();
            this._styler.updateToolbarItemAtIndex(this, i);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - Layout

    layoutSubviews: function(){
        this._styler.layoutToolbar(this);
    },

    getIntrinsicSize: function(){
        return this._styler.intrinsicSizeOfToolbar(this);
    }

});

UIToolbar.ImageSize = {
    default: 32,
    small: 24
};

UIToolbar.Styler = Object.create({}, {

    default: {
        configurable: true,
        get: function UIToolbarStyler_getDefault(){
            var styler = UIButtonCustomStyler.initWithItemColor(JSColor.initWithWhite(0.2));
            Object.defineProperty(this, 'default', {writable: true, value: styler});
            return styler;
        },
        set: function UIToolbarStyler_setDefault(styler){
            Object.defineProperty(this, 'default', {writable: true, value: styler});
        }
    }

});

JSClass("UIToolbarItemView", UIView, {

    index: -1,
    contentView: null,
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    _handlesEvents: false,
    active: false,
    stylerProperties: null,

    init: function(){
        UIToolbarItemView.$super.init.call(this);
        this.stylerProperties = {};
    },

    item: JSDynamicProperty('_item', null),

    setItem: function(item){
        this._item = item;
        if (this.contentView !== null){
            this.contentView.removeFromSuperview();
        }
        if (item.view){
            this.contentView = item.view;
            if (this.contentView.isKindOfClass(UIButton) && this.contentView._imageView){
                this.contentView._imageView.automaticRenderMode = JSImage.RenderMode.template;
            }
        }else{
            switch (item.identifier){
                case UIToolbarItem.Identifier.space:
                    this.contentView = UIToolbarItemSpaceView.initWithWidth(item.minimumWidth ? item.minimumWidth.width : item.toolbar.imageSize);
                    this._handlesEvents = false;
                    break;
                case UIToolbarItem.Identifier.flexibleSpace:
                    this.contentView = UIToolbarItemSpaceView.initWithWidth(0);
                    this._handlesEvents = false;
                    break;
                default:
                    this.contentView = UIImageView.initWithImage(item.image);
                    this.contentView.automaticRenderMode = JSImage.RenderMode.template;
                    this._handlesEvents = true;
                    break;
            }
        }
        this.contentView.tooltip = item.tooltip;
        this.addSubview(this.contentView);
    },

    _createTitleLabel: function(){
        var label = UILabel.init();
        label.textAlignment = JSTextAlignment.center;
        this.addSubview(label);
        return label;
    },

    layoutSubviews: function(){
        var toolbar = this._item.toolbar;
        if (this._item.identifier == UIToolbarItem.Identifier.custom && toolbar.showsTitles){
            var titleHeight = toolbar.styler.itemFont.displayLineHeight;
            var width;
            if (this._item.view !== null){
                width = this._item.minimumSize.width;
            }else{
                width = this._item.image.size.width * toolbar.imageSize / this._item.image.size.height;
            }
            this.contentView.frame = JSRect((this.bounds.size.width - width) / 2.0, 0, width, this.bounds.size.height - titleHeight);
            this.titleLabel.frame = JSRect(0, this.bounds.size.height - titleHeight, this.bounds.size.width, titleHeight);
        }else{
            this.contentView.frame = this.bounds;
        }
    },

    getIntrinsicSize: function(){
        var minWidth = this._item.minimumWidth;
        if (!isNaN(minWidth) && minWidth > 0){
            return JSSize(minWidth, UIView.noIntrinsicSize);
        }
        var contentSize = this.contentView.intrinsicSize;
        if (this._item.toolbar.showsTitles){
            var titleSize = this.titleLabel.intrinsicSize;
            return JSSize(Math.max(contentSize.width, titleSize.width), UIView.noIntrinsicSize);
        }
        return contentSize;
    },

    mouseDown: function(event){
        if (!this._handlesEvents){
            UIToolbarItemView.$super.mouseDown.call(this, event);
            return;
        }
        if (!this._item.enabled){
            return;
        }
        this.active = true;
        this._item.toolbar.styler.updateToolbarItemAtIndex(this._item.toolbar, this.index);
    },

    mouseDragged: function(event){
        if (!this._handlesEvents){
            UIToolbarItemView.$super.mouseDragged.call(this, event);
            return;
        }
        if (!this._item.enabled){
            return;
        }
        var location = event.locationInView(this);
        var active = this.containsPoint(location);
        if (active != this.active){
            this.active = active;
            this._item.toolbar.styler.updateToolbarItemAtIndex(this._item.toolbar, this.index);
        }
    },

    mouseUp: function(event){
        if (!this._handlesEvents){
            UIToolbarItemView.$super.mouseUp.call(this, event);
            return;
        }
        if (!this._item.enabled){
            return;
        }
        if (this.active){
            this.item.performAction();
            this.active = false;
            this._item.toolbar.styler.updateToolbarItemAtIndex(this._item.toolbar, this.index);
        }
    }

});

JSClass("UIToolbarItemSpaceView", UIView, {

    width: 0,

    initWithWidth: function(width){
        UIToolbarItemSpaceView.$super.init.call(this);
        this.width = width;
    },

    getIntrinsicSize: function(){
        return JSSize(this.width, UIView.noIntrinsicSize);
    }

});

JSClass("UIToolbarStyler", JSObject, {

    initializeToolbar: function(toolbar){
    },

    updateToolbar: function(toolbar){
    },

    updateToolbarItemAtIndex: function(toolbar, itemIndex){
    },

    layoutToolbar: function(toolbar){
    },

    intrinsicSizeOfToolbar: function(toolbar){
        return JSSize(UIView.noIntrinsicSize, 44);
    }

});

JSClass("UIToolbarCustomStyler", UIToolbarStyler, {

    itemFont: null,
    itemColor: null,
    activeItemColor: null,
    disabledItemColor: null,
    contentInsets: null,
    itemSpacing: 0,

    initWithItemColor: function(itemColor){
        this.contentInsets = JSInsets(5);
        this.itemColor = itemColor;
        this._fillInMissingStyles();
    },

    initWithSpec: function(spec){
        UIToolbarCustomStyler.$super.initWithSpec.call(this, spec);
        if (spec.containsKey("itemColor")){
            this.itemColor = spec.valueForKey("itemColor", JSColor);
        }
        if (spec.containsKey("activeItemColor")){
            this.activeItemColor = spec.valueForKey("activeItemColor", JSColor);
        }
        if (spec.containsKey("disabledItemColor")){
            this.disabledItemColor = spec.valueForKey("disabledItemColor", JSColor);
        }
        if (spec.containsKey("itemFont")){
            this.itemFont = spec.valueForKey("itemFont", JSFont);
        }
        if (spec.containsKey("contentInsets")){
            this.contentInsets = spec.valueForKey("contentInsets", JSInsets);
        }else{
            this.contentInsets = JSInsets(5);
        }
        if (spec.containsKey("itemSpacing")){
            this.itemSpacing = spec.valueForKey("itemSpacing");
        }
        this._fillInMissingStyles();
    },

    _fillInMissingStyles: function(){
        if (this.itemFont === null){
            this.itemFont = JSFont.systemFontOfSize(JSFont.Size.detail).fontWithWeight(JSFont.Weight.normal);
        }
        if (this.itemColor === null){
            this.itemColor = JSColor.initWithWhite(0.8);
        }
        if (this.activeItemColor === null){
            this.activeItemColor = this.itemColor.colorDarkenedByPercentage(0.5);
        }
        if (this.disabledItemColor === null){
            this.disabledItemColor = this.itemColor.colorWithAlpha(0.5);
        }
    },

    initializeToolbar: function(toolbar){
        toolbar.stylerProperties.itemViews = [];
        toolbar.stylerProperties.overflowButton = null;
        toolbar.stylerProperties.lastVisibleIndex = 0;
    },

    updateToolbar: function(toolbar){
        var i, l;
        var item, itemView;
        var props = toolbar.stylerProperties;
        for (i = 0, l = toolbar.items.length; i < l; ++i){
            item = toolbar.items[i];
            if (i < props.itemViews.length){
                itemView = props.itemViews[i];
            }else{
                itemView = UIToolbarItemView.init();
                props.itemViews.push(itemView);
                toolbar.addSubview(itemView);
            }
            itemView.index = i;
            itemView.item = item;
        }
        for (var j = l - 1; j >= i; --j){
            itemView = props.itemViews.pop();
            itemView.removeFromSuperview();
        }
        toolbar.setNeedsLayout();
    },

    updateToolbarItemAtIndex: function(toolbar, itemIndex){
        var item = toolbar.items[itemIndex];
        var itemView = toolbar.stylerProperties.itemViews[itemIndex];
        if (item.view === null){
            if (item.enabled){
                itemView.contentView.alpha = 1.0;
            }else{
                itemView.contentView.alpha = 0.4;
            }
        }
        if (toolbar.showsTitles){
            item.titleLabel.text = item.title;
            if (itemView.active){
                item.titleLabel.textColor = this.activeItemColor;
            }else if (item.enabled){
                item.titleLabel.textColor = this.itemColor;
            }else{
                item.titleLabel.textColor = this.disabledItemColor;
            }
        }
    },

    createOverflowButtonForToolbar: function(toolbar){
        var styler = UIButtonCustomStyler.initWithColor(this.itemColor);
        var button = UIButton.initWithStyler(styler);
        button.image = images.toolbarOverflow;
        button.addAction(function(){
            var menu = this.createOverflowMenuForToolbar(toolbar);
            if (menu !== null){
                this.showOverflowMenuForToolbar(menu, toolbar, button);
            }
        }, this);
        toolbar.addSubview(button);
        return button;
    },

    createOverflowMenuForToolbar: function(toolbar){
        var index = toolbar.stylerProperties.lastVisibleIndex;
        var overflowItems = [];
        var i, l;
        var item;
        var menuItem;
        var menu = null;
        var items = toolbar.items;
        for (i = index, l = items.length; i < l; ++i){
            item = items[i];
            if (item.identifier == UIToolbarItem.Identifier.custom){
                overflowItems.push(item);
            }
        }
        if (overflowItems.length > 0){
            menu = UIMenu.init();
            for (i = 0, l = overflowItems.length; i < l; ++i){
                item = overflowItems[i];
                if (item.menuFormRepresentation !== null){
                    menu.addItem(item.menuFormRepresentation);
                }else if (item.view !== null && item.view.isKindOfClass(UIPopupButton)){
                    menuItem = menu.addItemWithTitle(item.title);
                    menuItem.image = item.view.imageView.image;
                    menuItem.submenu = item.view.menu;
                }else if (item.view !== null && item.view.isKindOfClass(UIButton)){
                    menuItem = menu.addItemWithTitle(item.title, item.action, item.target);
                    menuItem.image = item.view.getImageForState(UIControl.State.normal);
                }else{
                    menuItem = menu.addItemWithTitle(item.title, item.action, item.target);
                    menuItem.image = item.image;
                }
            }
            return menu;
        }
        return null;
    },

    showOverflowMenuForToolbar: function(menu, toolbar, overflowButton){
        menu.openAdjacentToView(overflowButton, UIMenu.placement.below);
    },

    layoutToolbar: function(toolbar){
        var props = toolbar.stylerProperties;
        var availableWidth = toolbar.bounds.size.width - this.contentInsets.width;
        var maxHeight = toolbar.bounds.size.height - this.contentInsets.height;
        var x = this.contentInsets.left;
        var y = this.contentInsets.top;

        // Get the minimum sizes of all items
        var i, l;
        var itemSizes = [];
        var itemsWidth = 0;
        var itemView;
        var size;
        var item;
        var flexibleItemSizes = [];
        for (i = 0, l = toolbar.items.length; i < l; ++i){
            item = toolbar.items[i];
            itemView = props.itemViews[i];
            size = itemView.intrinsicSize;
            itemSizes.push(size);
            itemsWidth += size.width;
            if (item.identifier === UIToolbarItem.Identifier.flexibleSpace){
                flexibleItemSizes.push(size);
            }
        }
        itemsWidth += (props.itemViews.length - 1) * this.itemSpacing;

        // Back up if we've overflowed the available width
        props.lastVisibleIndex = props.itemViews.length - 1;
        if (itemsWidth > availableWidth){
            // position the overflow button
            if (props.overflowButton === null){
                props.overflowButton = this.createOverflowButtonForToolbar(toolbar);
            }
            size = props.overflowButton.intrinsicSize;
            props.overflowButton.frame = JSRect(toolbar.width - this.contentInsets.right - size.width, y + (maxHeight - size.height) / 2.0, size.width, size.height);
            // reduce available width by overflow button width
            availableWidth -= props.overflowButton.frame.width - this.itemSpacing;
            // Back up over any overflowing items
            for (; props.lastVisibleIndex >= 0 && itemsWidth > availableWidth; --props.lastVisibleIndex){
                size = itemSizes[props.lastVisibleIndex];
                itemsWidth -= size.width;
                if (props.lastVisibleIndex > 0){
                    itemsWidth -= this.itemSpacing;
                }
            }
        }else{
            if (props.overflowButton !== null){
                props.overflowButton.removeFromSuperview();
                props.overflowButton = null;
            }
        }

        // distribute extra space across flexible items
        var extraSpace = availableWidth - itemsWidth;
        if (flexibleItemSizes.length > 0){
            var flexibleWidth = extraSpace / flexibleItemSizes.length;
            for (i = 0, l = flexibleItemSizes.length; i < l; ++i){
                flexibleItemSizes[i].width = flexibleWidth;
            }
        }

        // Position each item, centered vertically in the middle
        for (i = 0, l = props.itemViews.length; i <= props.lastVisibleIndex; ++i){
            itemView = props.itemViews[i];
            itemView.hidden = false;
            item = itemView.item;
            size = itemSizes[i];
            if (item.view !== null){
                size.height = item.minimumSize.height;
            }else{
                size.height = toolbar.imageSize;
            }
            itemView.frame = JSRect(x, y + (maxHeight - size.height) / 2.0, size.width, size.height);
            x += size.width + this.itemSpacing;
        }
        for (i = props.lastVisibleIndex + 1; i < itemView.length; ++i){
            itemView = props.itemViews[i];
            itemView.hidden = true;
        }
    },

    intrinsicSizeOfToolbar: function(toolbar){
        var height = toolbar.imageSize + this.contentInsets.height;
        if (toolbar.showsTitles){
            height += this.itemFont.displayLineHeight;
        }
        return JSSize(UIView.noIntrinsicSize, height);
    }

});

var images = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.UIKit") });
            return this.bundle;
        }
    },

    toolbarOverflow: {
        configurable: true,
        get: function(){
            var image = JSImage.initWithResourceName("UIToolbarOverflow", this.bundle);
            Object.defineProperty(this, 'toolbarOverflow', {value: image.imageWithRenderingMode(JSImage.RenderMode.template) });
            return this.toolbarOverflow;
        }
    },

});

})();