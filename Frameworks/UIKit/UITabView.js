// #import "UIKit/UIView.js"
// #import "UIKit/UILabel.js"
/* global JSClass, JSObject, JSProtocol, JSSize, JSRect, JSInsets, JSColor, JSImage, JSPoint, JSReadOnlyProperty, JSDynamicProperty, UIView, UITabView, UILabel, JSLazyInitProperty, UILayer, UITabViewItemsView, UITabViewItemView, UITabViewStyler, UITabViewItem, UIImageView, UITabViewDefaultStyler, UITabViewContentContainer */
'use strict';

(function(){

JSProtocol("UITabViewDelegate", JSProtocol, {

    tabViewWillSelectItemAtIndex: ['tabView', 'index'],
    tabViewDidSelectItemAtIndex: ['tabView', 'index']

});

JSClass("UITabView", UIView, {

    items: JSDynamicProperty('_items', null),
    selectedIndex: JSDynamicProperty('_selectedIndex', 0),
    selectedItem: JSDynamicProperty(),
    styler: JSReadOnlyProperty('_styler', null),
    stylerProperties: null,
    delegate: null,
    _itemsView: null,
    _contentViewContainer: null,

    initWithFrame: function(frame){
        UITabView.$super.initWithFrame.call(this, frame);
        this._itemsView = UITabViewItemsView.init();
        this._itemsView.tabView = this;
        this._contentViewContainer = UITabViewContentContainer.init();
        this._styler = UITabView.defaultStyler;
        this._styler.initializeTabView(this);
        this.addSubview(this._itemsView);
        this.addSubview(this._contentViewContainer);
        this.setNeedsLayout();
    },

    _commonViewInit: function(){
        UITabView.$super._commonViewInit.call(this);
        this._items = [];
        this.stylerProperties = {};
    },

    addItemWithTitle: function(title){
        this.insertItemWithTitleAtIndex(title, this._items.length);
    },

    addItem: function(item){
        this.insertItemAtIndex(item, this._items.length);
    },

    insertItemAtIndex: function(item, index){
        if (this._items.length === 0){
            // The first item inserted is selected, so we need to notify delegate,
            // update the item state, and add the item's content view.  These are the
            // critical steps from setSelectedIndex, but done in a way that doesn't depend
            // on this._items changing in the middle.
            if (this.delegate && this.delegate.tabViewWillSelectItemAtIndex){
                this.delegate.tabViewWillSelectItemAtIndex(this, index);
            }
            item.selected = true;
            this._contentViewContainer.addSubview(item.view);
            if (this.delegate && this.delegate.tabViewDidSelectItemAtIndex){
                this.delegate.tabViewDidSelectItemAtIndex(this, index);
            }
        }else if (index <= this._selectedIndex){
            this._selectedIndex += 1;
        }
        this._items.splice(index, 0, item);
        this._itemsView.insertItemViewAtIndex(index);
    },

    insertItemWithTitleAtIndex: function(title, index){
        var item = UITabViewItem.initWithTitle(title);
        this.insertItemAtIndex(item, index);
    },

    removeItemAtIndex: function(index){
        var isRemovingOnlyItem = false;
        if (index == this._selectedIndex){
            if (index < this._items.length - 1){
                // If we're removing the selected item, select the next item if available
                // NOTE: doing so by setting the selected index causes setSelectedIndex to run
                // its normal steps, taking care of any delegate notifications and UI updates.
                // Basically, it's a way of keeping the remaining remove logic simple so it
                // only has to be concerned with removing deselected items.
                this.selectedIndex = index + 1;
            }else if (index > 0){
                // If the next item isn't available, select the previous item
                this.selectedIndex = index - 1;
            }else{
                // If we're removing the only item, there's no other item we can switch to first,
                // so we need to notify delegate, update the item state, and remove the item's content view.
                // These are the critical steps from setSelectedIndex, but done in a way that doesn't depend
                // on this._items changing in the middle.
                isRemovingOnlyItem = true;
                if (this.delegate && this.delegate.tabViewWillSelectItemAtIndex){
                    this.delegate.tabViewWillSelectItemAtIndex(this, 0);
                }
            }
        }
        var item = this._items[index];
        this._items.splice(index, 1);
        this._itemsView.removeItemAtIndex(index);
        if (isRemovingOnlyItem){
            item.selected = false;
            item.view.removeFromSuperview();
            if (this.delegate && this.delegate.tabViewDidSelectItemAtIndex){
                this.delegate.tabViewDidSelectItemAtIndex(this, 0);
            }
        }else{
            if (index <= this._selectedIndex){
                this._selectedIndex -= 1;
            }
        }
    },

    setSelectedIndex: function(selectedIndex){
        if (selectedIndex === this._selectedIndex){
            return;
        }
        if (this.delegate && this.delegate.tabViewWillSelectItemAtIndex){
            this.delegate.tabViewWillSelectItemAtIndex(this, selectedIndex);
        }
        var item = this.selectedItem;
        if (item !== null){
            item.selected = false;
            item.view.removeFromSuperview();
        }
        this._selectedIndex = selectedIndex;
        item = this.selectedItem;
        if (item !== null){
            item.selected = true;
            this._contentViewContainer.addSubview(item.view);
        }
        this._itemsView.selectedItemDidChange();
        if (this.delegate && this.delegate.tabViewDidSelectItemAtIndex){
            this.delegate.tabViewDidSelectItemAtIndex(this, selectedIndex);
        }
    },

    setSelectedItem: function(item){
        var index = this._items.indexOf(item);
        if (index >= 0){
            this.selectedIndex = index;
        }
    },

    getSelectedItem: function(){
        if (this._selectedIndex < this._items.length){
            return this._items[this._selectedIndex];
        }
        return null;
    },

    setItems: function(items){
        if (this._selectedIndex !== 0){
            this.selectedIndex = 0;
        }
        var i, l;
        for (i = this._items.length - 1; i >= 0; --i){
            this.removeItemAtIndex(i);
        }
        for (i = 0, l = items.length; i < l; ++i){
            this.addItem(items[i]);
        }
    },

    layoutSubviews: function(){
        UITabView.$super.layoutSubviews.call(this);
        this.styler.layoutTabView(this);
    }

});

JSClass("UITabViewItem", JSObject, {

    title: JSDynamicProperty("_tilte", null),
    image: JSDynamicProperty("_image", null),
    state: JSReadOnlyProperty("_state", 0),
    view: JSDynamicProperty("_view", null),
    active: JSDynamicProperty(),
    selected: JSDynamicProperty(),
    over: JSDynamicProperty(),

    initWithSpec: function(spec, values){
        if ('title' in values){
            this.title = spec.resolvedValue(values.title);
        }
        if ('image' in values){
            this.image = JSImage.initWithResourceName(spec.resolvedValue(values.image), spec.bundle);
        }
    },

    initWithTitle: function(title){
        this._tilte = title;
    },

    initWithImage: function(image){
        this._image = image;
    },

    _updateState: function(newState){
        if (newState != this._state){
            this._state = newState;
        }
    },

    _toggleState: function(flag, on){
        var newState = this._state;
        if (on){
            newState |= flag;
        }else{
            newState &= ~flag;
        }
        this._updateState(newState);
    },

    isOver: function(){
        return (this._state & UITabViewItem.State.over) === UITabViewItem.State.over;
    },

    setOver: function(isOver){
        this._toggleState(UITabViewItem.State.over, isOver);
    },

    isActive: function(){
        return (this._state & UITabViewItem.State.active) === UITabViewItem.State.active;
    },

    setActive: function(isActive){
        this._toggleState(UITabViewItem.State.active, isActive);
    },

    isSelected: function(){
        return (this._state & UITabViewItem.State.selected) ===  UITabViewItem.State.selected;
    },

    setSelected: function(isSelected){  
        this._toggleState(UITabViewItem.State.selected, isSelected);
    },

});

UITabViewItem.State = {
    normal:         0,
    over:           1 << 0,
    active:         1 << 1,
    selected:       1 << 2
};

JSClass("UITabViewItemView", UIView, {

    itemsView: null,
    index: 0,
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    imageView: JSLazyInitProperty('_createImageView', '_imageView'),
    item: null,

    _createTitleLabel: function(){
        var label = UILabel.init();
        this.addSubview(label);
        return label;
    },

    _createImageView: function(){
        var imageView = UIImageView.init();
        return imageView;
    },

    setItem: function(item){
        this.item = item;
        this.update();
    },

    update: function(){
        if (this.item.title){
            this.titleLabel.text = this.item.title;
            this._titleLabel.hidden = false;
        }else if (this._titleLabel !== null){
            this._titleLabel.hidden = true;
        }
        if (this.item.image){
            this.imageView.image = this.item.image;
            this.imageView.hidden = false;
        }else if (this._imageView !== null){
            this._imageView.hidden = true;
        }
        this.itemsView.tabView.styler.updateItemView(this);
        this.setNeedsLayout();
    },

    sizeToFit: function(){
        this.itemsView.tabView.styler.sizeItemViewToFit(this);
    },

    layoutSubviews: function(){
        this.itemsView.tabView.styler.layoutItemView(this);
    },

    isFirst: function(){
        return this.index === 0;
    },

    isLast: function(){
        return this.index === this.itemsView.tabView._items.length - 1;
    }

});

JSClass("UITabViewItemsView", UIView, {

    tabView: null,
    itemViews: null,
    _selectedItemView: null,
    _activeItemView: null,

    _commonViewInit: function(){
        UITabViewItemsView.$super._commonViewInit.call(this);
        this.itemViews = [];
    },

    _tabItemViewAtLocation: function(location){
        var itemView;
        for (var i = 0, l = this.itemViews.length; i < l; ++i){
            itemView = this.itemViews[i];
            if (itemView.hitTest(this.convertPointToView(location, itemView))){
                return itemView;
            }
        }
        return null;
    },

    update: function(){
        this._activeItemView = null;
        this._selectedItemView = null;
        var item;
        for (var i = 0, l = this.tabView.items.length; i < l; ++i){
            item = this.tabView.items[i];
            if (i < this.itemViews.length){
                this.itemViews[i].setItem(item);
            }else{
                this.insertItemViewAtIndex(i);
            }
            if (item.selected){
                this._selectedItemView = this.itemViews[i];
            }
        }
        for (var j = this.itemViews.length - 1; j >= i; --i){
            this.removeItemViewAtIndex(j);
        }
        this.tabView.setNeedsLayout();
        this.setNeedsLayout();
    },

    insertItemViewAtIndex: function(index){
        var itemView = UITabViewItemView.init();
        this.tabView.styler.initializeItemView(itemView);
        itemView.itemsView = this;
        itemView.index = index;
        this.addSubview(itemView);
        this.itemViews.splice(index, 0, itemView);
        itemView.setItem(this.tabView.items[index]);
        for (var i = index + 1, l = this.itemViews.length; i < l; ++i){
            this.itemViews[i].index = i;
        }
        this.update();
    },

    removeItemViewAtIndex: function(index){
        var itemView = this.itemViews[index];
        itemView.itemsView = null;
        itemView.removeFromSuperview();
        this.itemViews.splice(index, 1);
        for (var i = index, l = this.itemViews.length; i < l; ++i){
            this.itemViews[i].index = i;
        }
        this.update();
    },

    mouseDown: function(event){
        var location = event.locationInView(this);
        var tabItemView = this._tabItemViewAtLocation(location);
        this.activateItemView(tabItemView);
    },

    mouseDragged: function(event){
        var location = event.locationInView(this);
        var tabItemView = this._tabItemViewAtLocation(location);
        this.activateItemView(tabItemView);
    },

    mouseUp: function(event){
        this.activateItemView(null);
        var location = event.locationInView(this);
        var tabItemView = this._tabItemViewAtLocation(location);
        if (tabItemView){
            this.selectItemView(tabItemView);
        }
    },

    activateItemView: function(itemView){
        if (this._activeItemView){
            this._activeItemView.item.active = false;
            this._activeItemView.update();
        }
        this._activeItemView = itemView;
        if (this._activeItemView){
            this._activeItemView.item.active = true;
            this._activeItemView.update();
        }
    },

    selectItemView: function(itemView){
        this.tabView.selectedIndex = itemView.index;
    },

    selectedItemDidChange: function(){
        var itemView = this.itemViews[this.tabView.selectedIndex];
        if (this._selectedItemView){
            this._selectedItemView.item.selected = false;
            this._selectedItemView.update();
        }
        this._selectedItemView = itemView;
        if (this._selectedItemView){
            this._selectedItemView.item.selected = true;
            this._selectedItemView.update();
        }
    },

    sizeToFit: function(){
        this.tabView.styler.sizeItemsViewToFit(this);
    },

    layoutSubviews: function(){
        this.tabView.styler.layoutItemsView(this);
    }

});

JSClass("UITabViewContentContainer", UIView, {

    _insertSubviewAtIndex: function(subview, index, layerIndex){
        UITabViewContentContainer.$super._insertSubviewAtIndex.call(this, subview, index, layerIndex);
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        var subview;
        for (var i = 0, l = this.subviews.length; i < l; ++i){
            subview = this.subviews[i];
            subview.frame = this.bounds;
        }
    }
});

JSClass("UITabViewStyler", JSObject, {

    initializeTabView: function(tabView){
    },

    initializeItemView: function(itemView){
    },

    layoutTabView: function(tabView){
        var size = tabView.bounds.size;
        tabView._itemsView.sizeToFit();
        tabView._itemsView.position = JSPoint(size.width / 2.0, tabView._itemsView.frame.size.height / 2.0);
        var y = tabView._itemsView.frame.size.height;
        tabView._contentViewContainer.frame = JSRect(0, y, size.width, size.height - y);
    },

    sizeItemsViewToFit: function(itemsView){
        var itemView;
        var size = JSSize.Zero;
        for (var i = 0, l = itemsView.itemViews.length; i < l; ++i){
            itemView = itemsView.itemViews[i];
            itemView.sizeToFit();
            size.width += itemView.frame.size.width;
            if (itemView.frame.size.height > size.height){
                size.height = itemView.frame.size.height;
            }
        }
        itemsView.bounds = JSRect(JSPoint.Zero, size);
    },

    layoutItemsView: function(itemsView){
        var itemView;
        var x = 0;
        for (var i = 0, l = itemsView.itemViews.length; i < l; ++i){
            itemView = itemsView.itemViews[i];
            itemView.frame = JSRect(JSPoint(x, 0), itemView.frame.size);
            x += itemView.frame.size.width;
        }
    },

    sizeItemViewToFit: function(itemView){
    },

    layoutItemView: function(itemView){
    },

    updateItemView: function(itemView){
    },

});

JSClass("UITabViewDefaultStyler", UITabViewStyler, {

    cornerRadius: 3,
    itemPadding: null,
    itemsPadding: null,

    init: function(){
        this.itemPadding = JSInsets(4, 7);
        this.itemsPadding = JSInsets(4);
    },

    initializeTabView: function(tabView){
    },

    layoutTabView: function(tabView){
        var size = tabView.bounds.size;
        tabView._itemsView.sizeToFit();
        var y = this.itemsPadding.top;
        tabView._itemsView.position = JSPoint(size.width / 2.0, y + tabView._itemsView.frame.size.height / 2.0);
        y += tabView._itemsView.frame.size.height + this.itemsPadding.bottom;
        tabView._contentViewContainer.frame = JSRect(0, y, size.width, size.height - y);
    },

    initializeItemView: function(itemView){
        itemView.borderWidth = 1.0;
        itemView.cornerRadius = this.cornerRadius;
    },

    sizeItemViewToFit: function(itemView){
        var size = JSSize(this.itemPadding.left + this.itemPadding.right, this.itemPadding.top + this.itemPadding.bottom);
        if (itemView._titleLabel !== null){
            itemView._titleLabel.sizeToFit();
            size.width += Math.ceil(itemView._titleLabel.frame.size.width);
            size.height += Math.ceil(itemView._titleLabel.frame.size.height);
        }
        itemView.bounds = JSRect(JSPoint.Zero, size);
    },

    layoutItemView: function(itemView){
        if (itemView._titleLabel !== null){
            itemView._titleLabel.position = itemView.bounds.center;
        }
    },

    updateItemView: function(itemView){
        var item = itemView.item;
        itemView.backgroundColor = defaultStateBackgroundColors[item.state];
        itemView.borderColor = defaultStateBorderColors[item.state];
        if (itemView._titleLabel !== null){
            itemView._titleLabel.textColor = defaultStateTitleColors[item.state];
        }
        if (itemView.isFirst()){
            itemView.maskedCorners = UILayer.Corners.minX;
            itemView.maskedBorders = UILayer.Sides.minY | UILayer.Sides.maxY | UILayer.Sides.minX;
        }else if (itemView.isLast()){
            itemView.maskedCorners = UILayer.Corners.maxX;
            itemView.maskedBorders = UILayer.Sides.minY | UILayer.Sides.maxY | UILayer.Sides.maxX;
        }else{
            itemView.maskedCorners = UILayer.Corners.none;
            itemView.maskedBorders = UILayer.Sides.minY | UILayer.Sides.maxY;
        }
    },

});

var defaultStateBackgroundColors = [
    JSColor.initWithRGBA(250/255,250/255,250/255), // 0 normal
    JSColor.initWithRGBA(250/255,250/255,250/255), // 1 over
    JSColor.initWithRGBA(224/255,224/255,224/255), // 2 active
    JSColor.initWithRGBA(224/255,224/255,224/255), // 3 active + over
    JSColor.initWithRGBA(70/255,153/255,254/255),  // 4 selected
    JSColor.initWithRGBA(70/255,153/255,254/255),  // 5 selected + over
    JSColor.initWithRGBA(63/255,138/255,230/255),  // 6 selected + active
    JSColor.initWithRGBA(63/255,138/255,230/255),  // 7 selected + active + over
];

var defaultStateBorderColors = [
    JSColor.initWithRGBA(204/255,204/255,204/255), // 0 normal
    JSColor.initWithRGBA(204/255,204/255,204/255), // 1 over
    JSColor.initWithRGBA(192/255,192/255,192/255), // 2 active
    JSColor.initWithRGBA(192/255,192/255,192/255), // 3 active + over
    JSColor.initWithRGBA(63/255,138/255,230/255),  // 4 selected
    JSColor.initWithRGBA(63/255,138/255,230/255),  // 5 selected + over
    JSColor.initWithRGBA(54/255,123/255,205/255),  // 6 selected + active
    JSColor.initWithRGBA(54/255,123/255,205/255),  // 7 selected + active + over
];

var defaultStateTitleColors = [
    JSColor.initWithRGBA(51/255,51/255,51/255),    // 0 normal
    JSColor.initWithRGBA(51/255,51/255,51/255),    // 1 over
    JSColor.initWithRGBA(51/255,51/255,51/255),    // 2 active
    JSColor.initWithRGBA(51/255,51/255,51/255),    // 3 active + over
    JSColor.initWithRGBA(255/255,255/255,255/255), // 4 selected
    JSColor.initWithRGBA(255/255,255/255,255/255), // 5 selected + over
    JSColor.initWithRGBA(255/255,255/255,255/255), // 6 selected + active
    JSColor.initWithRGBA(255/255,255/255,255/255), // 7 selected + active + over
];

JSClass("UITabViewTablessStyler", UITabViewStyler, {

    initializeTabView: function(tabView){
        tabView._itemsView.hidden = true;
    },

    layoutTabView: function(tabView){
        tabView._contentViewContainer.frame = tabView.bounds;
    }

});

Object.defineProperties(UITabViewDefaultStyler, {
    shared: {
        configurable: true,
        get: function UITabViewDefaultStyler_getShared(){
            var shared = UITabViewDefaultStyler.init();
            Object.defineProperty(this, 'shared', {value: shared});
            return shared;
        }
    }
});

Object.defineProperties(UITabView, {
    defaultStyler: {
        configurable: true,
        get: function UITabView_getDefaultStyler(){
            Object.defineProperty(UITabView, 'defaultStyler', {writable: true, value: UITabViewDefaultStyler.shared});
            return UITabView.defaultStyler;
        },
        set: function UITabView_setDefaultStyler(defaultStyler){
            Object.defineProperty(UITabView, 'defaultStyler', {writable: true, value: defaultStyler});
        }
    }
});

})();