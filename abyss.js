var DEFAULT_ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var ZoomManager = /** @class */ (function () {
    /**
     * Place the settings.element in a zoom wrapper and init zoomControls.
     *
     * @param settings: a `ZoomManagerSettings` object
     */
    function ZoomManager(settings) {
        var _this = this;
        var _a, _b, _c, _d;
        this.settings = settings;
        if (!settings.element) {
            throw new DOMException('You need to set the element to wrap in the zoom element');
        }
        this.zoomLevels = (_a = settings.zoomLevels) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM_LEVELS;
        this._zoom = this.settings.defaultZoom || 1;
        if (this.settings.localStorageZoomKey) {
            var zoomStr = localStorage.getItem(this.settings.localStorageZoomKey);
            if (zoomStr) {
                this._zoom = Number(zoomStr);
            }
        }
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'bga-zoom-wrapper';
        this.wrapElement(this.wrapper, settings.element);
        this.wrapper.appendChild(settings.element);
        settings.element.classList.add('bga-zoom-inner');
        if ((_c = (_b = settings.zoomControls) === null || _b === void 0 ? void 0 : _b.visible) !== null && _c !== void 0 ? _c : true) {
            this.initZoomControls(settings);
        }
        if (this._zoom !== 1) {
            this.setZoom(this._zoom);
        }
        window.addEventListener('resize', function () {
            var _a;
            _this.zoomOrDimensionChanged();
            if ((_a = _this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth) {
                _this.setAutoZoom();
            }
        });
        if (window.ResizeObserver) {
            new ResizeObserver(function () { return _this.zoomOrDimensionChanged(); }).observe(settings.element);
        }
        if ((_d = this.settings.autoZoom) === null || _d === void 0 ? void 0 : _d.expectedWidth) {
            this.setAutoZoom();
        }
    }
    Object.defineProperty(ZoomManager.prototype, "zoom", {
        /**
         * Returns the zoom level
         */
        get: function () {
            return this._zoom;
        },
        enumerable: false,
        configurable: true
    });
    ZoomManager.prototype.setAutoZoom = function () {
        var _this = this;
        var _a, _b, _c;
        var zoomWrapperWidth = document.getElementById('bga-zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var expectedWidth = (_a = this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth;
        var newZoom = this.zoom;
        while (newZoom > this.zoomLevels[0] && newZoom > ((_c = (_b = this.settings.autoZoom) === null || _b === void 0 ? void 0 : _b.minZoomLevel) !== null && _c !== void 0 ? _c : 0) && zoomWrapperWidth / newZoom < expectedWidth) {
            newZoom = this.zoomLevels[this.zoomLevels.indexOf(newZoom) - 1];
        }
        if (this._zoom == newZoom) {
            if (this.settings.localStorageZoomKey) {
                localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
            }
        }
        else {
            this.setZoom(newZoom);
        }
    };
    /**
     * Set the zoom level. Ideally, use a zoom level in the zoomLevels range.
     * @param zoom zool level
     */
    ZoomManager.prototype.setZoom = function (zoom) {
        var _a, _b, _c, _d;
        if (zoom === void 0) { zoom = 1; }
        this._zoom = zoom;
        if (this.settings.localStorageZoomKey) {
            localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom);
        (_a = this.zoomInButton) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', newIndex === this.zoomLevels.length - 1);
        (_b = this.zoomOutButton) === null || _b === void 0 ? void 0 : _b.classList.toggle('disabled', newIndex === 0);
        this.settings.element.style.transform = zoom === 1 ? '' : "scale(".concat(zoom, ")");
        (_d = (_c = this.settings).onZoomChange) === null || _d === void 0 ? void 0 : _d.call(_c, this._zoom);
        this.zoomOrDimensionChanged();
    };
    /**
     * Call this method for the browsers not supporting ResizeObserver, everytime the table height changes, if you know it.
     * If the browsert is recent enough (>= Safari 13.1) it will just be ignored.
     */
    ZoomManager.prototype.manualHeightUpdate = function () {
        if (!window.ResizeObserver) {
            this.zoomOrDimensionChanged();
        }
    };
    /**
     * Everytime the element dimensions changes, we update the style. And call the optional callback.
     */
    ZoomManager.prototype.zoomOrDimensionChanged = function () {
        var _a, _b;
        this.settings.element.style.width = "".concat(this.wrapper.getBoundingClientRect().width / this._zoom, "px");
        this.wrapper.style.height = "".concat(this.settings.element.getBoundingClientRect().height, "px");
        (_b = (_a = this.settings).onDimensionsChange) === null || _b === void 0 ? void 0 : _b.call(_a, this._zoom);
    };
    /**
     * Simulates a click on the Zoom-in button.
     */
    ZoomManager.prototype.zoomIn = function () {
        if (this._zoom === this.zoomLevels[this.zoomLevels.length - 1]) {
            return;
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom) + 1;
        this.setZoom(newIndex === -1 ? 1 : this.zoomLevels[newIndex]);
    };
    /**
     * Simulates a click on the Zoom-out button.
     */
    ZoomManager.prototype.zoomOut = function () {
        if (this._zoom === this.zoomLevels[0]) {
            return;
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom) - 1;
        this.setZoom(newIndex === -1 ? 1 : this.zoomLevels[newIndex]);
    };
    /**
     * Changes the color of the zoom controls.
     */
    ZoomManager.prototype.setZoomControlsColor = function (color) {
        if (this.zoomControls) {
            this.zoomControls.dataset.color = color;
        }
    };
    /**
     * Set-up the zoom controls
     * @param settings a `ZoomManagerSettings` object.
     */
    ZoomManager.prototype.initZoomControls = function (settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.zoomControls = document.createElement('div');
        this.zoomControls.id = 'bga-zoom-controls';
        this.zoomControls.dataset.position = (_b = (_a = settings.zoomControls) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : 'top-right';
        this.zoomOutButton = document.createElement('button');
        this.zoomOutButton.type = 'button';
        this.zoomOutButton.addEventListener('click', function () { return _this.zoomOut(); });
        if ((_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.customZoomOutElement) {
            settings.zoomControls.customZoomOutElement(this.zoomOutButton);
        }
        else {
            this.zoomOutButton.classList.add("bga-zoom-out-icon");
        }
        this.zoomInButton = document.createElement('button');
        this.zoomInButton.type = 'button';
        this.zoomInButton.addEventListener('click', function () { return _this.zoomIn(); });
        if ((_d = settings.zoomControls) === null || _d === void 0 ? void 0 : _d.customZoomInElement) {
            settings.zoomControls.customZoomInElement(this.zoomInButton);
        }
        else {
            this.zoomInButton.classList.add("bga-zoom-in-icon");
        }
        this.zoomControls.appendChild(this.zoomOutButton);
        this.zoomControls.appendChild(this.zoomInButton);
        this.wrapper.appendChild(this.zoomControls);
        this.setZoomControlsColor((_f = (_e = settings.zoomControls) === null || _e === void 0 ? void 0 : _e.color) !== null && _f !== void 0 ? _f : 'black');
    };
    /**
     * Wraps an element around an existing DOM element
     * @param wrapper the wrapper element
     * @param element the existing element
     */
    ZoomManager.prototype.wrapElement = function (wrapper, element) {
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    };
    return ZoomManager;
}());
/**
 * Linear slide of the card from origin to destination.
 *
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function stockSlideAnimation(settings) {
    var promise = new Promise(function (success) {
        var _a;
        var originBR = settings.fromElement.getBoundingClientRect();
        var destinationBR = settings.element.getBoundingClientRect();
        var deltaX = (destinationBR.left + destinationBR.right) / 2 - (originBR.left + originBR.right) / 2;
        var deltaY = (destinationBR.top + destinationBR.bottom) / 2 - (originBR.top + originBR.bottom) / 2;
        settings.element.style.zIndex = '10';
        settings.element.style.transform = "translate(".concat(-deltaX, "px, ").concat(-deltaY, "px) rotate(").concat((_a = settings.rotationDelta) !== null && _a !== void 0 ? _a : 0, "deg)");
        var side = settings.element.dataset.side;
        if (settings.originalSide && settings.originalSide != side) {
            var cardSides_1 = settings.element.getElementsByClassName('card-sides')[0];
            cardSides_1.style.transition = 'none';
            settings.element.dataset.side = settings.originalSide;
            setTimeout(function () {
                cardSides_1.style.transition = null;
                settings.element.dataset.side = side;
            });
        }
        setTimeout(function () {
            settings.element.offsetHeight;
            settings.element.style.transition = "transform 0.5s linear";
            settings.element.offsetHeight;
            settings.element.style.transform = null;
        }, 10);
        setTimeout(function () {
            settings.element.style.zIndex = null;
            settings.element.style.transition = null;
            success(true);
        }, 600);
    });
    return promise;
}
function sortFunction() {
    var sortedFields = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sortedFields[_i] = arguments[_i];
    }
    return function (a, b) {
        for (var i = 0; i < sortedFields.length; i++) {
            var direction = 1;
            var field = sortedFields[i];
            if (field[0] == '-') {
                direction = -1;
                field = field.substring(1);
            }
            else if (field[0] == '+') {
                field = field.substring(1);
            }
            var type = typeof a[field];
            if (type === 'string') {
                var compare = a[field].localeCompare(b[field]);
                if (compare !== 0) {
                    return compare;
                }
            }
            else if (type === 'number') {
                var compare = (a[field] - b[field]) * direction;
                if (compare !== 0) {
                    return compare * direction;
                }
            }
        }
        return 0;
    };
}
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
/**
 * The abstract stock. It shouldn't be used directly, use stocks that extends it.
 */
var CardStock = /** @class */ (function () {
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function CardStock(manager, element, settings) {
        this.manager = manager;
        this.element = element;
        this.cards = [];
        this.selectedCards = [];
        this.selectionMode = 'none';
        manager.addStock(this);
        element === null || element === void 0 ? void 0 : element.classList.add('card-stock' /*, this.constructor.name.split(/(?=[A-Z])/).join('-').toLowerCase()* doesn't work in production because of minification */);
        this.bindClick();
        this.sort = settings === null || settings === void 0 ? void 0 : settings.sort;
    }
    /**
     * @returns the cards on the stock
     */
    CardStock.prototype.getCards = function () {
        return this.cards.slice();
    };
    /**
     * @returns if the stock is empty
     */
    CardStock.prototype.isEmpty = function () {
        return !this.cards.length;
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.getSelection = function () {
        return this.selectedCards.slice();
    };
    /**
     * @param card a card
     * @returns if the card is present in the stock
     */
    CardStock.prototype.contains = function (card) {
        var _this = this;
        return this.cards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    // TODO keep only one ?
    CardStock.prototype.cardInStock = function (card) {
        var element = document.getElementById(this.manager.getId(card));
        return element ? this.cardElementInStock(element) : false;
    };
    CardStock.prototype.cardElementInStock = function (element) {
        return (element === null || element === void 0 ? void 0 : element.parentElement) == this.element;
    };
    /**
     * @param card a card in the stock
     * @returns the HTML element generated for the card
     */
    CardStock.prototype.getCardElement = function (card) {
        return document.getElementById(this.manager.getId(card));
    };
    /**
     * Checks if the card can be added. By default, only if it isn't already present in the stock.
     *
     * @param card the card to add
     * @param settings the addCard settings
     * @returns if the card can be added
     */
    CardStock.prototype.canAddCard = function (card, settings) {
        return !this.cardInStock(card);
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    CardStock.prototype.addCard = function (card, animation, settings) {
        var _a, _b;
        if (!this.canAddCard(card, settings)) {
            return Promise.resolve(false);
        }
        var promise;
        // we check if card is in stock then we ignore animation
        var currentStock = this.manager.getCardStock(card);
        var index = this.getNewCardIndex(card);
        var settingsWithIndex = __assign({ index: index }, (settings !== null && settings !== void 0 ? settings : {}));
        if (currentStock === null || currentStock === void 0 ? void 0 : currentStock.cardInStock(card)) {
            var element = document.getElementById(this.manager.getId(card));
            promise = this.moveFromOtherStock(card, element, __assign(__assign({}, animation), { fromStock: currentStock }), settingsWithIndex);
            element.dataset.side = ((_a = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _a !== void 0 ? _a : true) ? 'front' : 'back';
        }
        else if ((animation === null || animation === void 0 ? void 0 : animation.fromStock) && animation.fromStock.cardInStock(card)) {
            var element = document.getElementById(this.manager.getId(card));
            promise = this.moveFromOtherStock(card, element, animation, settingsWithIndex);
        }
        else {
            var element = this.manager.createCardElement(card, ((_b = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _b !== void 0 ? _b : true));
            promise = this.moveFromElement(card, element, animation, settingsWithIndex);
        }
        this.setSelectableCard(card, this.selectionMode != 'none');
        if (settingsWithIndex.index !== null && settingsWithIndex.index !== undefined) {
            this.cards.splice(index, 0, card);
        }
        else {
            this.cards.push(card);
        }
        if (!promise) {
            console.warn("CardStock.addCard didn't return a Promise");
            return Promise.resolve(false);
        }
        return promise;
    };
    CardStock.prototype.getNewCardIndex = function (card) {
        if (this.sort) {
            var otherCards = this.getCards();
            for (var i = 0; i < otherCards.length; i++) {
                var otherCard = otherCards[i];
                if (this.sort(card, otherCard) < 0) {
                    return i;
                }
            }
            return otherCards.length;
        }
        else {
            return undefined;
        }
    };
    CardStock.prototype.addCardElementToParent = function (cardElement, settings) {
        var _a;
        var parent = (_a = settings === null || settings === void 0 ? void 0 : settings.forceToElement) !== null && _a !== void 0 ? _a : this.element;
        if ((settings === null || settings === void 0 ? void 0 : settings.index) === null || (settings === null || settings === void 0 ? void 0 : settings.index) === undefined || !parent.children.length || (settings === null || settings === void 0 ? void 0 : settings.index) >= parent.children.length) {
            parent.appendChild(cardElement);
        }
        else {
            parent.insertBefore(cardElement, parent.children[settings.index]);
        }
    };
    CardStock.prototype.moveFromOtherStock = function (card, cardElement, animation, settings) {
        var promise;
        this.addCardElementToParent(cardElement, settings);
        cardElement.classList.remove('selectable', 'selected', 'disabled');
        promise = this.animationFromElement({
            element: cardElement,
            fromElement: animation.fromStock.element,
            originalSide: animation.originalSide,
            rotationDelta: animation.rotationDelta,
            animation: animation.animation,
        });
        // in the case the card was move inside the same stock we don't remove it
        if (animation.fromStock != this) {
            animation.fromStock.removeCard(card);
        }
        if (!promise) {
            console.warn("CardStock.moveFromOtherStock didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    CardStock.prototype.moveFromElement = function (card, cardElement, animation, settings) {
        var promise;
        this.addCardElementToParent(cardElement, settings);
        if (animation) {
            if (animation.fromStock) {
                promise = this.animationFromElement({
                    element: cardElement,
                    fromElement: animation.fromStock.element,
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
                animation.fromStock.removeCard(card);
            }
            else if (animation.fromElement) {
                promise = this.animationFromElement({
                    element: cardElement,
                    fromElement: animation.fromElement,
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
            }
        }
        else {
            promise = Promise.resolve(false);
        }
        if (!promise) {
            console.warn("CardStock.moveFromElement didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    /**
     * Add an array of cards to the stock.
     *
     * @param cards the cards to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @param shift if number, the number of milliseconds between each card. if true, chain animations
     */
    CardStock.prototype.addCards = function (cards, animation, settings, shift) {
        var _this = this;
        if (shift === void 0) { shift = false; }
        if (shift === true) {
            if (cards.length) {
                this.addCard(cards[0], animation, settings).then(function () { return _this.addCards(cards.slice(1), animation, settings, shift); });
            }
            return;
        }
        if (shift) {
            var _loop_1 = function (i) {
                setTimeout(function () { return _this.addCard(cards[i], animation, settings); }, i * shift);
            };
            for (var i = 0; i < cards.length; i++) {
                _loop_1(i);
            }
        }
        else {
            cards.forEach(function (card) { return _this.addCard(card, animation, settings); });
        }
    };
    /**
     * Remove a card from the stock.
     *
     * @param card the card to remove
     */
    CardStock.prototype.removeCard = function (card) {
        if (this.cardInStock(card)) {
            this.manager.removeCard(card);
        }
        this.cardRemoved(card);
    };
    CardStock.prototype.cardRemoved = function (card) {
        var _this = this;
        var index = this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.cards.splice(index, 1);
        }
        if (this.selectedCards.find(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); })) {
            this.unselectCard(card);
        }
    };
    /**
     * Remove a set of card from the stock.
     *
     * @param cards the cards to remove
     */
    CardStock.prototype.removeCards = function (cards) {
        var _this = this;
        cards.forEach(function (card) { return _this.removeCard(card); });
    };
    /**
     * Remove all cards from the stock.
     */
    CardStock.prototype.removeAll = function () {
        var _this = this;
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (card) { return _this.removeCard(card); });
    };
    CardStock.prototype.setSelectableCard = function (card, selectable) {
        var element = this.getCardElement(card);
        element.classList.toggle('selectable', selectable);
    };
    /**
     * Set if the stock is selectable, and if yes if it can be multiple.
     * If set to 'none', it will unselect all selected cards.
     *
     * @param selectionMode the selection mode
     */
    CardStock.prototype.setSelectionMode = function (selectionMode) {
        var _this = this;
        if (selectionMode === 'none') {
            this.unselectAll(true);
        }
        this.cards.forEach(function (card) { return _this.setSelectableCard(card, selectionMode != 'none'); });
        this.element.classList.toggle('selectable', selectionMode != 'none');
        this.selectionMode = selectionMode;
    };
    /**
     * Set selected state to a card.
     *
     * @param card the card to select
     */
    CardStock.prototype.selectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        if (this.selectionMode === 'single') {
            this.cards.filter(function (c) { return _this.manager.getId(c) != _this.manager.getId(card); }).forEach(function (c) { return _this.unselectCard(c, true); });
        }
        var element = this.getCardElement(card);
        element.classList.add('selected');
        this.selectedCards.push(card);
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Set unselected state to a card.
     *
     * @param card the card to unselect
     */
    CardStock.prototype.unselectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var element = this.getCardElement(card);
        element.classList.remove('selected');
        var index = this.selectedCards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.selectedCards.splice(index, 1);
        }
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Select all cards
     */
    CardStock.prototype.selectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        this.cards.forEach(function (c) { return _this.selectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    /**
     * Unelect all cards
     */
    CardStock.prototype.unselectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (c) { return _this.unselectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    CardStock.prototype.bindClick = function () {
        var _this = this;
        var _a;
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function (event) {
            var cardDiv = event.target.closest('.card');
            if (!cardDiv) {
                return;
            }
            var card = _this.cards.find(function (c) { return _this.manager.getId(c) == cardDiv.id; });
            if (!card) {
                return;
            }
            _this.cardClick(card);
        });
    };
    CardStock.prototype.cardClick = function (card) {
        var _this = this;
        var _a;
        if (this.selectionMode != 'none') {
            var alreadySelected = this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (alreadySelected) {
                this.unselectCard(card);
            }
            else {
                this.selectCard(card);
            }
        }
        (_a = this.onCardClick) === null || _a === void 0 ? void 0 : _a.call(this, card);
    };
    CardStock.prototype.animationFromElement = function (settings) {
        var _a;
        if (document.visibilityState !== 'hidden' && !this.manager.game.instantaneousMode) {
            var animation = (_a = settings.animation) !== null && _a !== void 0 ? _a : stockSlideAnimation;
            return animation(settings);
        }
        else {
            return Promise.resolve(false);
        }
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     */
    CardStock.prototype.setCardVisible = function (card, visible, settings) {
        this.manager.setCardVisible(card, visible, settings);
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     */
    CardStock.prototype.flipCard = function (card, settings) {
        this.manager.flipCard(card, settings);
    };
    return CardStock;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * Abstract stock to represent a deck. (pile of cards, with a fake 3d effect of thickness).
 */
var Deck = /** @class */ (function (_super) {
    __extends(Deck, _super);
    function Deck(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('deck');
        _this.element.style.setProperty('--width', settings.width + 'px');
        _this.element.style.setProperty('--height', settings.height + 'px');
        _this.thicknesses = (_a = settings.thicknesses) !== null && _a !== void 0 ? _a : [0, 2, 5, 10, 20, 30];
        _this.setCardNumber((_b = settings.cardNumber) !== null && _b !== void 0 ? _b : 52);
        _this.autoUpdateCardNumber = (_c = settings.autoUpdateCardNumber) !== null && _c !== void 0 ? _c : true;
        var shadowDirection = (_d = settings.shadowDirection) !== null && _d !== void 0 ? _d : 'bottom-right';
        var shadowDirectionSplit = shadowDirection.split('-');
        var xShadowShift = shadowDirectionSplit.includes('right') ? 1 : (shadowDirectionSplit.includes('left') ? -1 : 0);
        var yShadowShift = shadowDirectionSplit.includes('bottom') ? 1 : (shadowDirectionSplit.includes('top') ? -1 : 0);
        _this.element.style.setProperty('--xShadowShift', '' + xShadowShift);
        _this.element.style.setProperty('--yShadowShift', '' + yShadowShift);
        return _this;
    }
    Deck.prototype.setCardNumber = function (cardNumber) {
        var _this = this;
        this.cardNumber = cardNumber;
        this.element.dataset.empty = (this.cardNumber == 0).toString();
        var thickness = 0;
        this.thicknesses.forEach(function (threshold, index) {
            if (_this.cardNumber >= threshold) {
                thickness = index;
            }
        });
        this.element.style.setProperty('--thickness', thickness + 'px');
    };
    Deck.prototype.addCard = function (card, animation, settings) {
        return _super.prototype.addCard.call(this, card, animation, settings);
    };
    Deck.prototype.cardRemoved = function (card) {
        if (this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber - 1);
        }
        _super.prototype.cardRemoved.call(this, card);
    };
    return Deck;
}(CardStock));
/**
 * A basic stock for a list of cards, based on flex.
 */
var LineStock = /** @class */ (function (_super) {
    __extends(LineStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `LineStockSettings` object
     */
    function LineStock(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('line-stock');
        element.dataset.center = ((_a = settings === null || settings === void 0 ? void 0 : settings.center) !== null && _a !== void 0 ? _a : true).toString();
        element.style.setProperty('--wrap', (_b = settings === null || settings === void 0 ? void 0 : settings.wrap) !== null && _b !== void 0 ? _b : 'wrap');
        element.style.setProperty('--direction', (_c = settings === null || settings === void 0 ? void 0 : settings.direction) !== null && _c !== void 0 ? _c : 'row');
        element.style.setProperty('--gap', (_d = settings === null || settings === void 0 ? void 0 : settings.gap) !== null && _d !== void 0 ? _d : '8px');
        return _this;
    }
    return LineStock;
}(CardStock));
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * A stock with fixed slots (some can be empty)
 */
var SlotStock = /** @class */ (function (_super) {
    __extends(SlotStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `SlotStockSettings` object
     */
    function SlotStock(manager, element, settings) {
        var _this = this;
        var _a, _b;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        _this.slotsIds = [];
        _this.slots = [];
        element.classList.add('slot-stock');
        _this.mapCardToSlot = settings.mapCardToSlot;
        _this.slotsIds = (_a = settings.slotsIds) !== null && _a !== void 0 ? _a : [];
        _this.slotClasses = (_b = settings.slotClasses) !== null && _b !== void 0 ? _b : [];
        _this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
        return _this;
    }
    SlotStock.prototype.createSlot = function (slotId) {
        var _a;
        this.slots[slotId] = document.createElement("div");
        this.slots[slotId].dataset.slotId = slotId;
        this.element.appendChild(this.slots[slotId]);
        (_a = this.slots[slotId].classList).add.apply(_a, __spreadArray(['slot'], this.slotClasses, true));
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToSlotSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    SlotStock.prototype.addCard = function (card, animation, settings) {
        var _a, _b;
        var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
        if (slotId === undefined) {
            throw new Error("Impossible to add card to slot : no SlotId. Add slotId to settings or set mapCardToSlot to SlotCard constructor.");
        }
        if (!this.slots[slotId]) {
            throw new Error("Impossible to add card to slot \"".concat(slotId, "\" : slot \"").concat(slotId, "\" doesn't exists."));
        }
        var newSettings = __assign(__assign({}, settings), { forceToElement: this.slots[slotId] });
        return _super.prototype.addCard.call(this, card, animation, newSettings);
    };
    /**
     * Change the slots ids. Will empty the stock before re-creating the slots.
     *
     * @param slotsIds the new slotsIds. Will replace the old ones.
     */
    SlotStock.prototype.setSlotsIds = function (slotsIds) {
        var _this = this;
        if (slotsIds.length == this.slotsIds.length && slotsIds.every(function (slotId, index) { return _this.slotsIds[index] === slotId; })) {
            // no change
            return;
        }
        this.removeAll();
        this.element.innerHTML = '';
        this.slotsIds = slotsIds !== null && slotsIds !== void 0 ? slotsIds : [];
        this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
    };
    SlotStock.prototype.cardElementInStock = function (element) {
        return (element === null || element === void 0 ? void 0 : element.parentElement.parentElement) == this.element;
    };
    SlotStock.prototype.canAddCard = function (card, settings) {
        var _a, _b;
        if (!this.cardInStock(card)) {
            return true;
        }
        else {
            var currentCardSlot = this.getCardElement(card).closest('.slot').dataset.slotId;
            var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
            return currentCardSlot != slotId;
        }
    };
    return SlotStock;
}(LineStock));
/**
 * A stock to make cards disappear (to automatically remove discarded cards, or to represent a bag)
 */
var VoidStock = /** @class */ (function (_super) {
    __extends(VoidStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function VoidStock(manager, element) {
        var _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('void-stock');
        return _this;
    }
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    VoidStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        // center the element
        var cardElement = this.getCardElement(card);
        cardElement.style.left = "".concat((this.element.clientWidth - cardElement.clientWidth) / 2, "px");
        cardElement.style.top = "".concat((this.element.clientHeight - cardElement.clientHeight) / 2, "px");
        if (!promise) {
            console.warn("VoidStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise.then(function (result) {
            _this.removeCard(card);
            return result;
        });
    };
    return VoidStock;
}(CardStock));
/**
 * A stock with manually placed cards
 */
var ManualPositionStock = /** @class */ (function (_super) {
    __extends(ManualPositionStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function ManualPositionStock(manager, element, settings, updateDisplay) {
        var _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        _this.updateDisplay = updateDisplay;
        element.classList.add('manual-position-stock');
        return _this;
    }
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    ManualPositionStock.prototype.addCard = function (card, animation, settings) {
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        this.updateDisplay(this.element, this.getCards(), card, this);
        return promise;
    };
    ManualPositionStock.prototype.cardRemoved = function (card) {
        _super.prototype.cardRemoved.call(this, card);
        this.updateDisplay(this.element, this.getCards(), card, this);
    };
    return ManualPositionStock;
}(CardStock));
var CardManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `CardManagerSettings` object
     */
    function CardManager(game, settings) {
        this.game = game;
        this.settings = settings;
        this.stocks = [];
    }
    CardManager.prototype.addStock = function (stock) {
        this.stocks.push(stock);
    };
    /**
     * @param card the card informations
     * @return the id for a card
     */
    CardManager.prototype.getId = function (card) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.settings).getId) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : "card-".concat(card.id);
    };
    CardManager.prototype.createCardElement = function (card, visible) {
        var _a, _b, _c, _d, _e, _f;
        if (visible === void 0) { visible = true; }
        var id = this.getId(card);
        var side = visible ? 'front' : 'back';
        // TODO check if exists
        var element = document.createElement("div");
        element.id = id;
        element.dataset.side = '' + side;
        element.innerHTML = "\n            <div class=\"card-sides\">\n                <div class=\"card-side front\">\n                </div>\n                <div class=\"card-side back\">\n                </div>\n            </div>\n        ";
        element.classList.add('card');
        document.body.appendChild(element);
        (_b = (_a = this.settings).setupDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element);
        (_d = (_c = this.settings).setupFrontDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element.getElementsByClassName('front')[0]);
        (_f = (_e = this.settings).setupBackDiv) === null || _f === void 0 ? void 0 : _f.call(_e, card, element.getElementsByClassName('back')[0]);
        document.body.removeChild(element);
        return element;
    };
    /**
     * @param card the card informations
     * @return the HTML element of an existing card
     */
    CardManager.prototype.getCardElement = function (card) {
        return document.getElementById(this.getId(card));
    };
    CardManager.prototype.removeCard = function (card) {
        var _a;
        var id = this.getId(card);
        var div = document.getElementById(id);
        if (!div) {
            return;
        }
        // if the card is in a stock, notify the stock about removal
        (_a = this.getCardStock(card)) === null || _a === void 0 ? void 0 : _a.cardRemoved(card);
        div.id = "deleted".concat(id);
        // TODO this.removeVisibleInformations(div);
        div.remove();
    };
    /**
     * @param card the card informations
     * @return the stock containing the card
     */
    CardManager.prototype.getCardStock = function (card) {
        return this.stocks.find(function (stock) { return stock.contains(card); });
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     */
    CardManager.prototype.setCardVisible = function (card, visible, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g;
        var element = this.getCardElement(card);
        if (!element) {
            return;
        }
        element.dataset.side = visible ? 'front' : 'back';
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.updateFront) !== null && _a !== void 0 ? _a : true) {
            (_c = (_b = this.settings).setupFrontDiv) === null || _c === void 0 ? void 0 : _c.call(_b, card, element.getElementsByClassName('front')[0]);
        }
        if ((_d = settings === null || settings === void 0 ? void 0 : settings.updateBack) !== null && _d !== void 0 ? _d : false) {
            (_f = (_e = this.settings).setupBackDiv) === null || _f === void 0 ? void 0 : _f.call(_e, card, element.getElementsByClassName('back')[0]);
        }
        if ((_g = settings === null || settings === void 0 ? void 0 : settings.updateData) !== null && _g !== void 0 ? _g : true) {
            // card data has changed
            var stock = this.getCardStock(card);
            var cards = stock.getCards();
            var cardIndex = cards.findIndex(function (c) { return _this.getId(c) === _this.getId(card); });
            if (cardIndex !== -1) {
                stock.cards.splice(cardIndex, 1, card);
            }
        }
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     */
    CardManager.prototype.flipCard = function (card, settings) {
        var element = this.getCardElement(card);
        var currentlyVisible = element.dataset.side === 'front';
        this.setCardVisible(card, !currentlyVisible, settings);
    };
    return CardManager;
}());
var AllyManager = /** @class */ (function (_super) {
    __extends(AllyManager, _super);
    function AllyManager(game) {
        var _this = _super.call(this, game, {
            getId: function (ally) { return "ally-".concat(ally.ally_id); },
            setupDiv: function (ally, div) {
                div.classList.add("ally");
                div.dataset.allyId = "".concat(ally.ally_id);
                div.dataset.faction = "".concat(ally.faction);
                div.dataset.value = "".concat(ally.value);
                _this.game.setTooltip(div.id, _this.renderTooltip(ally));
            },
            setupFrontDiv: function (ally, div) {
                div.dataset.faction = "".concat(ally.faction);
                div.dataset.value = "".concat(ally.value);
                if (ally.effect) {
                    div.dataset.effect = "".concat(ally.effect);
                }
                div.classList.add('ally-side', "ally-".concat(ally.faction, "-").concat(ally.value));
            },
            setupBackDiv: function (ally, div) {
                div.classList.add('ally-side', "ally-back");
            },
        }) || this;
        _this.game = game;
        return _this;
    }
    AllyManager.prototype.allyNameText = function (faction) {
        // 1 Crab, coloured
        var allies = [
            '<span style="color: purple">' + _('Jellyfish') + '</span>',
            '<span style="color: red">' + _('Crab') + '</span>',
            '<span style="color: #999900">' + _('Seahorse') + '</span>',
            '<span style="color: green">' + _('Shellfish') + '</span>',
            '<span style="color: blue">' + _('Squid') + '</span>'
        ];
        allies[10] = '<span style="color: gray">' + _('Kraken') + '</span>';
        return allies[faction];
    };
    AllyManager.prototype.renderTooltip = function (ally) {
        if (ally.faction !== null && ally.faction != 100) {
            return "<div class=\"abs-tooltip-ally\">\n        ".concat(this.allyNameText(ally.faction), "\n        <br>\n        <span style=\"font-size: smaller\"><b>").concat(_("Value"), ": </b> ").concat(_(ally.value), "</span>\n      </div>");
        }
        else {
            return "<div class=\"abs-tooltip-ally\">\n        ".concat(_("Monster"), "\n      </div>");
        }
    };
    AllyManager.prototype.renderBack = function () {
        return "<div class=\"ally ally-black\" style=\"z-index: 1\"></div>";
    };
    AllyManager.prototype.factionIcon = function (f) {
        // TODO : Actual icon?
        if (f == 0) {
            return 'Purple';
        }
        else if (f == 1) {
            return 'Red';
        }
        else if (f == 2) {
            return 'Yellow';
        }
        else if (f == 3) {
            return 'Green';
        }
        else if (f == 4) {
            return 'Blue';
        }
    };
    return AllyManager;
}(CardManager));
var LordManager = /** @class */ (function (_super) {
    __extends(LordManager, _super);
    function LordManager(game) {
        var _this = _super.call(this, game, {
            getId: function (lord) { return "lord-".concat(lord.lord_id); },
            setupDiv: function (lord, div) {
                div.classList.add("lord");
                if (lord.turned) {
                    div.classList.add("disabled");
                }
                div.dataset.lordId = "".concat(lord.lord_id);
                div.dataset.cost = "".concat(lord.cost);
                div.dataset.diversity = "".concat(lord.diversity);
                div.dataset.used = "".concat(lord.used);
                div.dataset.turned = "".concat(lord.turned);
                div.dataset.effect = "".concat(lord.effect);
                div.dataset.keys = "".concat(lord.keys);
                _this.game.setTooltip(div.id, _this.renderTooltip(lord));
            },
            setupFrontDiv: function (lord, div) {
                div.dataset.lordId = "".concat(lord.lord_id);
                div.classList.add("lord-side", "lord-".concat(lord.lord_id));
                div.innerHTML = "\n          <span class=\"lord-desc\"><span class=\"lord-name\">".concat(_(lord.name), "</span>").concat(_(lord.desc), "</span>\n        ");
            },
            setupBackDiv: function (lord, div) {
                div.classList.add("lord-side", "lord-back");
            },
        }) || this;
        _this.game = game;
        return _this;
    }
    LordManager.prototype.renderTooltip = function (lord) {
        var _this = this;
        var descSection = "";
        if (lord.desc != "") {
            descSection = '<hr>';
            if (lord.effect == 1) {
                descSection += '<b>' + _('When recruited') + ':</b> ';
            }
            descSection += _(lord.desc);
        }
        var guilds = [
            '<span style="color: purple">' + _('Mage') + '</span>',
            '<span style="color: red">' + _('Soldier') + '</span>',
            '<span style="color: #999900">' + _('Farmer') + '</span>',
            '<span style="color: green">' + _('Merchant') + '</span>',
            '<span style="color: blue">' + _('Politician') + '</span>',
            '<span style="color: gray">' + _('Ambassador') + '</span>',
        ];
        guilds[10] = '<span style="color: gray">' + _('Smuggler') + '</span>';
        var factionSection = "";
        if (lord.faction != null) {
            factionSection = '<span style="font-size: smaller">' + guilds[lord.faction] + "</span><br>";
        }
        else {
            factionSection = '<span style="font-size: smaller">' + guilds[guilds.length - 1] + "</span><br>";
        }
        var diversitySection = "";
        for (var i = 0; i < lord.diversity; i++) {
            var colour = "#666";
            if (i == 0 && lord.faction != null) {
                if (lord.faction == 0) {
                    colour = "purple";
                }
                else if (lord.faction == 1) {
                    colour = "red";
                }
                else if (lord.faction == 2) {
                    colour = "#999900";
                }
                else if (lord.faction == 3) {
                    colour = "green";
                }
                else if (lord.faction == 4) {
                    colour = "blue";
                }
            }
            diversitySection += "<div style=\"display: inline-block; margin-right: 2px; width: 10px; height: 10px; border-radius: 5px; background-color: ".concat(colour, ";\"></div>");
        }
        var keysString = "";
        for (var i = 0; i < lord.keys; i++) {
            keysString += ' <i class="icon icon-key"></i>';
        }
        var costString = _('Cost');
        var costNumber = lord.cost;
        var trueCost = costNumber;
        var playerTable = this.game.getCurrentPlayerTable();
        // Only show true costs for lords in the row
        // I have the Treasurer (25) : cost - 2
        if (playerTable === null || playerTable === void 0 ? void 0 : playerTable.hasLord(25)) {
            trueCost -= 2;
        }
        // I don't have the protector (14) ...
        if (!(playerTable === null || playerTable === void 0 ? void 0 : playerTable.hasLord(14))) {
            // Another player has the Recruiter (1) : cost + 2
            if (this.game.getOpponentsIds(this.game.getPlayerId()).some(function (opponentId) { var _a; return (_a = _this.game.getPlayerTable(opponentId)) === null || _a === void 0 ? void 0 : _a.hasLord(1); })) {
                trueCost = +trueCost + 2;
            }
        }
        if (+trueCost < 0)
            trueCost = 0;
        if (+trueCost != +costNumber) {
            costNumber = "<del>".concat(costNumber, "</del> ").concat(trueCost);
        }
        return "<div class=\"abs-tooltip-lord\">\n      <span style=\"float: right\">".concat(_(lord.points), " <i class=\"fa fa-star\"></i>").concat(keysString, "</span>\n      <h3 style=\"padding-right: 60px;\">").concat(_(lord.name), "</h3>\n      ").concat(factionSection, "\n      <span style=\"font-size: smaller\"><b>").concat(costString, ": </b> ").concat(costNumber, " ").concat(diversitySection, "</span>\n      ").concat(descSection, "\n    </div>");
    };
    LordManager.prototype.updateLordKeys = function (playerId, playerTable) {
        if (playerTable === void 0) { playerTable = this.game.getPlayerTable(playerId); }
        if (playerTable) {
            var lords = playerTable.getFreeLords();
            var keys = lords.map(function (lord) { return lord.keys; }).reduce(function (a, b) { return a + b; }, 0);
            this.game.keyFreeLordsCounts[playerId] = keys;
            this.game.updateKeyCounter(playerId);
        }
    };
    return LordManager;
}(CardManager));
var CompressedLineStock = /** @class */ (function (_super) {
    __extends(CompressedLineStock, _super);
    function CompressedLineStock(manager, element) {
        var _this = _super.call(this, manager, element, undefined, function (element, cards) { return _this.manualPosition(element, cards); }) || this;
        _this.manager = manager;
        _this.element = element;
        return _this;
    }
    CompressedLineStock.prototype.manualPosition = function (element, cards) {
        var _this = this;
        var MARGIN = 5;
        var CARD_WIDTH = 85;
        var cardDistance = CARD_WIDTH + MARGIN;
        var containerWidth = element.clientWidth;
        var uncompressedWidth = (cards.length * CARD_WIDTH) + ((cards.length - 1) * MARGIN);
        if (uncompressedWidth > containerWidth) {
            cardDistance = Math.floor(CARD_WIDTH * containerWidth / ((cards.length + 2) * CARD_WIDTH));
        }
        cards.forEach(function (card, index) {
            var cardDiv = _this.getCardElement(card);
            var cardLeft = cardDistance * index;
            cardDiv.style.left = "".concat(cardLeft, "px");
        });
    };
    return CompressedLineStock;
}(ManualPositionStock));
var LocationManager = /** @class */ (function (_super) {
    __extends(LocationManager, _super);
    function LocationManager(game, lordManager, lootManager) {
        var _this = _super.call(this, game, {
            getId: function (location) { return "location-".concat(location.location_id); },
            setupDiv: function (location, div) {
                var lordHolder = document.createElement('div');
                lordHolder.classList.add('trapped-lords-holder');
                _this.lordsStocks[location.location_id] = new LineStock(_this.lordManager, lordHolder);
                _this.lordsStocks[location.location_id].onCardClick = function (card) { return _this.game.onClickPlayerLockedLord(card); };
                div.prepend(lordHolder);
                div.classList.add("location", "board");
                div.dataset.locationId = "".concat(location.location_id);
                _this.game.setTooltip(div.id, _this.renderTooltip(location));
            },
            setupFrontDiv: function (location, div) {
                var _a;
                var desc = _this.makeDesc(location, true);
                div.classList.add('location-side', "location-".concat(location.location_id));
                div.innerHTML = "\n        <div class=\"location-clicker\"></div>\n        <span class=\"location-name\">".concat(_(location.name), "</span>\n        <span class=\"location-desc\">").concat(desc, "</span>\n        <div class=\"\"></div>\n        ");
                if ([103, 104, 105, 106].includes(location.location_id)) {
                    div.insertAdjacentHTML('beforeend', "<div id=\"loot-stock-".concat(location.location_id, "\" class=\"loot-stock\"></div>"));
                    _this.lootStocks[location.location_id] = new CompressedLineStock(lootManager, document.getElementById("loot-stock-".concat(location.location_id)));
                    if ((_a = location.loots) === null || _a === void 0 ? void 0 : _a.length) {
                        _this.lootStocks[location.location_id].addCards(location.loots);
                    }
                }
            },
            setupBackDiv: function (location, div) {
                div.classList.add('location-side', 'location-back');
            }
        }) || this;
        _this.game = game;
        _this.lordManager = lordManager;
        _this.lootManager = lootManager;
        _this.lordsStocks = [];
        _this.lootStocks = [];
        return _this;
    }
    LocationManager.prototype.makeDesc = function (location, laurel) {
        var TEXT_HIGHLIGHT = {
            farmer: '<span class="race-shadow" style="--race-color: #999900;;">' + _('Farmer') + '</span>',
            soldier: '<span class="race-shadow" style="--race-color: red;">' + _('Soldier') + '</span>',
            merchant: '<span class="race-shadow" style="--race-color: green;">' + _('Merchant') + '</span>',
            politician: '<span class="race-shadow" style="--race-color: blue;">' + _('Politician') + '</span>',
            mage: '<span class="race-shadow" style="--race-color: purple;">' + _('Mage') + '</span>',
            smuggler: '<span class="race-shadow" style="--race-color: gray;">' + _('Smuggler') + '</span>',
            seahorse: '<span class="race-shadow" style="--race-color: #999900;">' + _('Seahorse') + '</span>',
            crab: '<span class="race-shadow" style="--race-color: red;">' + _('Crab') + '</span>',
            shellfish: '<span class="race-shadow" style="--race-color: green;">' + _('Shellfish') + '</span>',
            squid: '<span class="race-shadow" style="--race-color: blue;">' + _('Squid') + '</span>',
            jellyfish: '<span class="race-shadow" style="--race-color: purple;">' + _('Jellyfish') + '</span>',
        };
        // TODO : Wrap points in nobr to avoid line breaks
        var desc = dojo.replace(_(location.desc), TEXT_HIGHLIGHT);
        if (laurel) {
            desc = desc.replace(/(\d+)?\$/g, function (_, points) {
                return "<i class=\"icon icon-laurel\">".concat(points !== null && points !== void 0 ? points : '', "</i>");
            });
        }
        else {
            desc = desc.replace(/\$/g, '<i class="fa fa-star"></i>');
        }
        return desc;
    };
    LocationManager.prototype.renderTooltip = function (location) {
        var desc = this.makeDesc(location);
        return "<div class=\"abs-tooltip-location\">\n      <h3 style=\"padding-right: 50px;\">".concat(_(location.name), "</h3>\n      <hr>\n      ").concat(desc, "\n    </div>");
    };
    LocationManager.prototype.addLords = function (locationId, lords) {
        this.lordsStocks[locationId].addCards(lords);
    };
    LocationManager.prototype.addLoot = function (locationId, loot) {
        this.lootStocks[locationId].addCard(loot, {
            fromElement: document.getElementById('page-title'),
        });
    };
    LocationManager.prototype.highlightLootsToDiscard = function (locationId, loots) {
        var _this = this;
        loots.forEach(function (loot) { var _a; return (_a = _this.lootManager.getCardElement(loot)) === null || _a === void 0 ? void 0 : _a.classList.add('selected'); });
    };
    LocationManager.prototype.discardLoots = function (locationId, loots) {
        this.lootStocks[locationId].removeCards(loots);
    };
    LocationManager.prototype.removeLordsOnLocation = function (location) {
        this.lordsStocks[location.location_id].removeAll();
    };
    return LocationManager;
}(CardManager));
var LootManager = /** @class */ (function (_super) {
    __extends(LootManager, _super);
    function LootManager(game) {
        var _this = _super.call(this, game, {
            getId: function (loot) { return "loot-".concat(loot.id); },
            setupDiv: function (loot, div) {
                div.classList.add("loot");
                _this.game.setTooltip(div.id, _this.renderTooltip(loot));
            },
            setupFrontDiv: function (loot, div) {
                div.dataset.value = "".concat(loot.value);
            },
        }) || this;
        _this.game = game;
        return _this;
    }
    LootManager.prototype.getEffect = function (value) {
        switch (value) {
            case 3:
                return _('Gives a key token');
            case 4:
                return _('Gives 2 pearls');
            case 5:
                return _('Draw a monster token');
            case 6:
                return _('Draw the top card from the Exploration draw deck');
            default:
                return _('Nothing');
        }
    };
    LootManager.prototype.renderTooltip = function (loot) {
        return "<div class=\"abs-tooltip-ally\">\n      ".concat(_('Loot'), "\n      <br>\n      <span style=\"font-size: smaller\"><b>").concat(_("Value"), ": </b> ").concat(loot.value, "</span>\n      <br>\n      <span style=\"font-size: smaller\"><b>").concat(_("Effect"), ": </b> ").concat(this.getEffect(loot.value), "</span>\n      <div></div>\n    </div>");
    };
    return LootManager;
}(CardManager));
var MonsterManager = /** @class */ (function (_super) {
    __extends(MonsterManager, _super);
    function MonsterManager(game) {
        var _this = _super.call(this, game, {
            getId: function (monster) { return "monster-".concat(monster.monster_id); },
            setupDiv: function (monster, div) {
                div.classList.add("monster");
                div.dataset.type = "".concat(monster.type);
            },
            setupFrontDiv: function (monster, div) {
                div.id = "".concat(_this.getId(monster), "-front");
                if (monster.value) {
                    div.dataset.value = "".concat(monster.value);
                    div.innerHTML = "".concat(monster.value);
                }
                if (monster.effect) {
                    div.dataset.effect = "".concat(monster.effect);
                }
                _this.game.setTooltip(div.id, _this.renderTooltip(monster));
            },
            setupBackDiv: function (monster, div) {
                div.id = "".concat(_this.getId(monster), "-back");
                div.dataset.value = "".concat(monster.value);
                if (monster.effect) {
                    div.dataset.effect = "".concat(monster.effect);
                }
                _this.game.setTooltip(div.id, monster.type == 1 ? /* TODO LEV _*/ ('Leviathan Monster token') : /* TODO LEV _*/ ('Base game Monster token'));
            },
        }) || this;
        _this.game = game;
        return _this;
    }
    MonsterManager.prototype.getEffect = function (value) {
        switch (value) {
            case 1:
                return /*TODO LEV_*/ ('Gain 2 pearls');
            case 2:
                return /*TODO LEV_*/ ('Gain 3 pearls');
            case 3:
                return /*TODO LEV_*/ ('Gain 1 key');
            case 4:
                return /*TODO LEV_*/ ('Gain 1 Council stack');
            default:
                return _('Nothing');
        }
    };
    MonsterManager.prototype.renderTooltip = function (monster) {
        return "<div>\n      ".concat(_('Monster token'), "<br>\n      ").concat(monster.value ? "<span style=\"font-size: smaller\"><b>".concat(_("Value"), ": </b> ").concat(monster.value, "</span>") : '', "\n      ").concat(monster.effect ? "<span style=\"font-size: smaller\"><b>".concat(_("Effect"), ": </b> ").concat(this.getEffect(monster.effect), "</span>") : '', "\n    </div>");
    };
    return MonsterManager;
}(CardManager));
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.affiliatedStocks = [];
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();
        var template = "\n        <div id=\"player-panel-".concat(player.id, "\" class=\"player-panel whiteblock\">\n            <h3 class=\"player-name\" style=\"color: #").concat(player.color, ";\" data-color=\"").concat(player.color, "\">").concat(player.name, "</h3>\n            ").concat(this.currentPlayer ? "<div id=\"player-hand\" class=\"hand\"><i id=\"no-hand-msg\">".concat(_("No Allies in hand"), "</i></div>") : '', "\n            <h4>").concat(_("Affiliated Allies"), "</h4>\n            <i id=\"no-affiliated-msg-p").concat(player.id, "\">").concat(_("No Affiliated Allies"), "</i>\n            <div id=\"player-panel-").concat(player.id, "-affiliated\" class=\"affiliated\"></div>\n            <h4>").concat(_("Lords"), "</h4>\n            <i id=\"no-lords-msg-p").concat(player.id, "\">").concat(_("No Lords"), "</i>\n            <div id=\"player-panel-").concat(player.id, "-free-lords\" class=\"free-lords\"></div>\n            <div id=\"player-panel-").concat(player.id, "-locations\" class=\"locations\"></div>\n            <div id=\"player-panel-").concat(player.id, "-sentinels\" class=\"sentinels\"></div>\n        </div>\n        ");
        dojo.place(template, $('player-panel-holder'));
        // Add a whiteblock for the player
        if (this.currentPlayer) {
            this.hand = new LineStock(this.game.allyManager, document.getElementById('player-hand'), {
                center: false,
                sort: PlayerTable.sortAllies,
            });
            this.hand.onCardClick = function (card) { return _this.game.onClickPlayerHand(card); };
            this.hand.addCards(player.hand);
        }
        // Add player affiliated
        this.placeAffiliated(player.affiliated, this.playerId);
        // Add free lords
        this.freeLords = new LineStock(this.game.lordManager, document.getElementById("player-panel-".concat(player.id, "-free-lords")), {
            center: false,
        });
        this.freeLords.onCardClick = function (card) { return _this.game.onClickPlayerFreeLord(card); };
        this.freeLords.addCards(player.lords.filter(function (lord) { return lord.location == null; }));
        // Add locations
        this.locations = new LineStock(this.game.locationManager, document.getElementById("player-panel-".concat(player.id, "-locations")), {
            center: false,
        });
        this.locations.onCardClick = function (card) { return _this.game.onClickPlayerLocation(card); };
        player.locations.forEach(function (location) { return _this.addLocation(location, player.lords.filter(function (lord) { return lord.location == location.location_id; }), true); });
        this.game.lordManager.updateLordKeys(this.playerId, this);
    }
    PlayerTable.prototype.addHandAlly = function (ally, fromElement, originalSide, rotationDelta) {
        this.hand.addCard(ally, {
            fromElement: fromElement,
            originalSide: originalSide,
            rotationDelta: rotationDelta,
        });
        this.game.organisePanelMessages();
    };
    PlayerTable.prototype.removeAllies = function (allies) {
        var _a;
        (_a = this.hand) === null || _a === void 0 ? void 0 : _a.removeCards(allies);
        this.affiliatedStocks.forEach(function (stock) { return stock.removeCards(allies); });
    };
    PlayerTable.prototype.getSelectedAllies = function () {
        var _this = this;
        var _a, _b;
        return ((_b = (_a = this.hand) === null || _a === void 0 ? void 0 : _a.getCards()) !== null && _b !== void 0 ? _b : []).filter(function (card) { var _a; return (_a = _this.game.allyManager.getCardElement(card)) === null || _a === void 0 ? void 0 : _a.classList.contains('selected'); });
    };
    PlayerTable.prototype.organisePanelMessages = function () {
        // Do they have any Lords?
        var lords = dojo.query('.lord', $('player-panel-' + this.playerId));
        $('no-lords-msg-p' + this.playerId).style.display = lords.length > 0 ? 'none' : 'block';
        // Affiliated?
        var affiliated = this.getAffiliatedAllies();
        $('no-affiliated-msg-p' + this.playerId).style.display = affiliated.length > 0 ? 'none' : 'block';
        if (this.currentPlayer) {
            // Hand?
            var hand = this.hand.getCards();
            $('no-hand-msg').style.display = hand.length > 0 ? 'none' : 'block';
        }
    };
    PlayerTable.prototype.placeAffiliated = function (allies, playerId) {
        var _this = this;
        var parent = document.getElementById("player-panel-".concat(playerId, "-affiliated"));
        for (var faction = 0; faction < 5; faction++) {
            var factionHolder = dojo.create("div");
            factionHolder.className = "affiliated-faction";
            factionHolder.setAttribute("data-faction", faction);
            dojo.place(factionHolder, parent);
            this.affiliatedStocks[faction] = new LineStock(this.game.allyManager, factionHolder, {
                center: false,
                sort: PlayerTable.sortAllies,
            });
            this.affiliatedStocks[faction].addCards(allies.filter(function (ally) { return ally.faction == faction; }));
            this.affiliatedStocks[faction].onCardClick = function (ally) { return _this.affiliatedAllyClick(ally); };
        }
        return parent;
    };
    PlayerTable.prototype.addAffiliated = function (ally) {
        this.affiliatedStocks[ally.faction].addCard(ally);
    };
    PlayerTable.prototype.addLord = function (lord) {
        this.freeLords.addCard(lord);
    };
    PlayerTable.prototype.removeLords = function (lords) {
        this.freeLords.removeCards(lords);
    };
    PlayerTable.prototype.getAffiliatedAllies = function () {
        var affiliated = [];
        for (var faction = 0; faction < 5; faction++) {
            affiliated.push.apply(affiliated, this.affiliatedStocks[faction].getCards());
        }
        return affiliated;
    };
    PlayerTable.prototype.addLocation = function (location, lords, init) {
        var _this = this;
        this.locations.addCard(location).then(function (animated) {
            // if loot location, scroll to it
            if (animated && !init && [103, 104, 105, 106].includes(location.location_id)) {
                var element = _this.game.locationManager.getCardElement(location);
                var rect = element.getBoundingClientRect();
                var isVisible = (rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth));
                if (!isVisible) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center',
                    });
                }
            }
        });
        this.game.locationManager.addLords(location.location_id, lords);
    };
    PlayerTable.prototype.affiliatedAllyClick = function (ally) {
        if (this.game.gamedatas.gamestate.name === 'lord114multi') {
            this.game.discardAllies([ally.ally_id]);
        }
    };
    PlayerTable.prototype.getFreeLords = function (includeDisabled) {
        var _this = this;
        if (includeDisabled === void 0) { includeDisabled = false; }
        var lords = this.freeLords.getCards();
        if (!includeDisabled) {
            lords = lords.filter(function (lord) { return !_this.freeLords.getCardElement(lord).classList.contains('disabled'); });
        }
        return lords;
    };
    PlayerTable.prototype.hasLord = function (lordId, includeDisabled) {
        if (includeDisabled === void 0) { includeDisabled = false; }
        return this.getFreeLords(includeDisabled).some(function (lord) { return lord.lord_id == lordId; });
    };
    PlayerTable.prototype.removeLocation = function (location) {
        this.locations.removeCard(location);
        this.game.locationManager.removeLordsOnLocation(location);
    };
    PlayerTable.sortAllies = sortFunction('faction', 'value');
    return PlayerTable;
}());
var isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
var log = isDebug ? console.log.bind(window.console) : function () { };
var debounce;
var ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5];
var LOCAL_STORAGE_ZOOM_KEY = 'Abyss-zoom';
var Abyss = /** @class */ (function () {
    function Abyss() {
        this.playersTables = [];
        this.councilStacks = [];
        this.monsterTokens = [];
        this.pearlCounters = [];
        this.nebulisCounters = [];
        this.keyTokenCounts = [];
        this.keyFreeLordsCounts = [];
        this.keyCounters = [];
        this.monsterCounters = [];
        this.allyCounters = [];
        this.lordCounters = [];
        this.woundCounters = [];
        this.defeatedLeviathanCounters = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
    }
    Abyss.prototype.setup = function (gamedatas) {
        var _this = this;
        var _a;
        log("Starting game setup");
        if (!gamedatas.krakenExpansion) {
            this.dontPreloadImage("kraken.png");
            this.dontPreloadImage("lords-kraken.jpg");
            this.dontPreloadImage("loots.jpg");
        }
        if (!gamedatas.leviathanExpansion) {
            this.dontPreloadImage("scourge.png");
            this.dontPreloadImage("lords-leviathan.jpg");
            this.dontPreloadImage("icons-leviathan.png");
            this.dontPreloadImage("icons-leviathan.png");
            this.dontPreloadImage("allies-leviathan.jpg");
        }
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.allyManager = new AllyManager(this);
        this.lordManager = new LordManager(this);
        this.lootManager = new LootManager(this);
        this.locationManager = new LocationManager(this, this.lordManager, this.lootManager);
        this.monsterManager = new MonsterManager(this);
        dojo.connect($('modified-layout-checkbox'), 'onchange', function () {
            dojo.toggleClass($('game-board-holder'), "playmat", $('modified-layout-checkbox').checked);
        });
        var usePlaymat = this.prefs[100].value == 1;
        // On resize, fit cards to screen (debounced)
        if (usePlaymat) {
            dojo.addClass($('game-board-holder'), "playmat");
        }
        var onResize = function () {
            var _a, _b, _c;
            var w = ((_a = document.getElementById('bga-zoom-wrapper')) === null || _a === void 0 ? void 0 : _a.clientWidth) / ((_c = (_b = _this.zoomManager) === null || _b === void 0 ? void 0 : _b.zoom) !== null && _c !== void 0 ? _c : 1);
            if (usePlaymat) {
                var narrowPlaymat = w < 1340;
                dojo.toggleClass($('game-board-holder'), "playmat", !narrowPlaymat);
                dojo.toggleClass($('game-board-holder'), "playmat-narrow", narrowPlaymat);
            }
            _this.organiseLocations();
        };
        dojo.connect(window, "onresize", debounce(function () { return onResize(); }, 200));
        if (gamedatas.krakenExpansion) {
            document.getElementById('scoring-row-total').insertAdjacentHTML('beforebegin', "\n                <tr id=\"scoring-row-nebulis\">\n                    <td class=\"first-column\"><span class=\"arrow\">\u2192</span><i id=\"scoring-nebulis-icon\" class=\"icon icon-nebulis\"></i></td>\n                </tr>\n                <tr id=\"scoring-row-kraken\">\n                    <td class=\"first-column\"><span class=\"arrow\">\u2192</span><i id=\"scoring-kraken-icon\" class=\"icon-kraken\"></i></td>\n                </tr>\n            ");
        }
        if (gamedatas.leviathanExpansion) {
            document.getElementById('scoring-row-total').insertAdjacentHTML('beforebegin', "\n                <tr id=\"scoring-row-wound\">\n                    <td class=\"first-column\"><span class=\"arrow\">\u2192</span><i id=\"scoring-wound-icon\" class=\"icon leviathan-icon icon-wound\"></i></td>\n                </tr>\n                <tr id=\"scoring-row-scourge\">\n                    <td class=\"first-column\"><span class=\"arrow\">\u2192</span><i id=\"scoring-scourge-icon\" class=\"icon-scourge\"></i></td>\n                </tr>\n            ");
        }
        // Setting up player boards
        this.createPlayerPanels(gamedatas);
        // Add an extra column at the end, just for padding reasons
        $('scoring-row-players').innerHTML += "<td></td>";
        $('scoring-row-location').innerHTML += "<td></td>";
        $('scoring-row-lord').innerHTML += "<td></td>";
        $('scoring-row-affiliated').innerHTML += "<td></td>";
        $('scoring-row-monster').innerHTML += "<td></td>";
        if (gamedatas.krakenExpansion) {
            $('scoring-row-nebulis').innerHTML += "<td></td>";
            $('scoring-row-kraken').innerHTML += "<td></td>";
        }
        if (gamedatas.leviathanExpansion) {
            $('scoring-row-wound').innerHTML += "<td></td>";
            $('scoring-row-scourge').innerHTML += "<td></td>";
        }
        $('scoring-row-total').innerHTML += "<td></td>";
        var p = this.player_id;
        if (this.isSpectator) {
            p = gamedatas.playerorder[0];
        }
        var players_done = {};
        do {
            if (players_done[p])
                break;
            players_done[p] = 1;
            var player = gamedatas.players[p];
            var table = new PlayerTable(this, player);
            this.playersTables.push(table);
            p = gamedatas.turn_order[p];
        } while (p != this.player_id);
        // Lords
        this.visibleLords = new SlotStock(this.lordManager, document.getElementById('visible-lords-stock'), {
            slotsIds: [1, 2, 3, 4, 5, 6],
            mapCardToSlot: function (lord) { return lord.place; },
        });
        this.visibleLords.addCards(gamedatas.lord_slots);
        this.visibleLords.onCardClick = function (lord) { return _this.onVisibleLordClick(lord); };
        // Allies
        this.visibleAllies = new SlotStock(this.allyManager, document.getElementById('visible-allies-stock'), {
            slotsIds: [1, 2, 3, 4, 5],
            mapCardToSlot: function (ally) { return ally.place; },
        });
        this.visibleAllies.addCards(gamedatas.ally_explore_slots);
        this.visibleAllies.onCardClick = function (ally) { return _this.onVisibleAllyClick(ally); };
        for (var i in gamedatas.ally_council_slots) {
            var num = gamedatas.ally_council_slots[i];
            var deck = dojo.query('#council-track .slot-' + i);
            this.setDeckSize(deck, num);
            this.councilStacks[i] = new VoidStock(this.allyManager, deck[0]);
        }
        this.setDeckSize(dojo.query('#lords-track .slot-0'), gamedatas.lord_deck);
        this.setDeckSize(dojo.query('#explore-track .slot-0'), gamedatas.ally_deck);
        // Threat level
        var threat_token = $('threat-token');
        dojo.removeClass(threat_token, "slot-0 slot-1 slot-2 slot-3 slot-4 slot-5");
        dojo.addClass(threat_token, "slot-" + gamedatas.threat_level);
        // Locations
        this.visibleLocations = new LineStock(this.locationManager, document.getElementById('visible-locations-stock'), {
            center: false,
            direction: 'column',
        });
        this.visibleLocations.addCards(gamedatas.location_available);
        this.visibleLocations.onCardClick = function (location) { return _this.onVisibleLocationClick(location); };
        this.visibleLocationsOverflow = new LineStock(this.locationManager, document.getElementById('locations-holder-overflow'));
        this.visibleLocationsOverflow.onCardClick = function (location) { return _this.onVisibleLocationClick(location); };
        this.organiseLocations();
        this.setDeckSize(dojo.query('#locations-holder .location-back'), gamedatas.location_deck);
        // Clickers
        document.getElementById('explore-track-deck').addEventListener('click', function (e) { return _this.onClickExploreDeck(e); });
        document.getElementById('council-track').addEventListener('click', function (e) { return _this.onClickCouncilTrack(e); });
        // Tooltips
        // Hide this one, because it doesn't line up due to Zoom
        //this.setTooltip( 'explore-track-deck', '', _('Explore'), 1 );
        var pearlTooltip = _('Pearls');
        if (gamedatas.krakenExpansion) {
            pearlTooltip += ' / ' + _('Nebulis');
        }
        this.setTooltipToClass('pearl-holder', pearlTooltip);
        this.setTooltipToClass('monster-holder', _('Monster tokens'));
        this.setTooltipToClass('ally-holder', _('Ally cards in hand'));
        this.setTooltipToClass('lordcount-holder', _('Number of Lords'));
        // TODO LEV this.setTooltipToClass('leviathan-holder', _('Wounds / Defeated Leviathans'));
        this.setTooltip('scoring-location-icon', _('Locations'));
        this.setTooltip('scoring-lords-icon', _('Lords'));
        this.setTooltip('scoring-affiliated-icon', _('Affiliated Allies'));
        this.setTooltip('scoring-monster-tokens-icon', _('Monster tokens'));
        if (gamedatas.krakenExpansion) {
            this.setTooltip('scoring-nebulis-icon', _('Nebulis'));
            this.setTooltip('scoring-kraken-icon', _('Kraken'));
        }
        if (gamedatas.leviathanExpansion) {
            // TODO LEV this.setTooltip('scoring-nebulis-icon', _( 'Wounds' ));
            // TODO LEV this.setTooltip('scoring-kraken-icon', _( 'Scourge' ));
        }
        // Localisation of options box
        $('option-desc').innerHTML = _('Which Ally cards do you want to automatically pass on?');
        $('option-all').innerHTML = _('All');
        $('option-jellyfish').innerHTML = _('Jellyfish');
        $('option-crab').innerHTML = _('Crab');
        $('option-seahorse').innerHTML = _('Seahorse');
        $('option-shellfish').innerHTML = _('Shellfish');
        $('option-squid').innerHTML = _('Squid');
        $('text-total').innerHTML = _('Total');
        $('last-round').innerHTML = _('This is the last round of the game!');
        // Only show auto-pass options for actual players
        if (!this.isSpectator) {
            // $('gameplay-options').style.display = this.bRealtime ? 'none' : 'inline-block';
            $('gameplay-options').style.display = 'inline-block';
        }
        // Only show the game end warning if it's the end of the game!
        $('page-title').appendChild($('last-round'));
        if (gamedatas.game_ending_player >= 0) {
            // $('gameplay-options').style.display = this.bRealtime ? 'none' : 'inline-block';
            dojo.style($('last-round'), { 'display': 'block' });
        }
        (_a = this.gamedatas.sentinels) === null || _a === void 0 ? void 0 : _a.filter(function (sentinel) { return sentinel.playerId; }).forEach(function (sentinel) { return _this.placeSentinelToken(sentinel.playerId, sentinel.lordId, sentinel.location, sentinel.locationArg); });
        // Insert options into option box
        var me = gamedatas.players[this.player_id];
        if (me) {
            if (!me.autopass) {
                me.autopass = "0;0;0;0;0";
            }
            if (me.autopass) {
                var pieces = me.autopass.split(";");
                if (pieces.length > 5) {
                    pieces = [0, 0, 0, 0, 0];
                }
                if (pieces.length >= 5) {
                    var firstValue = +pieces[0];
                    var allSame = true;
                    for (var i_1 = 0; i_1 < 5; i_1++) {
                        var max = +pieces[i_1];
                        if (max != firstValue) {
                            allSame = false;
                        }
                        for (var j = 0; j <= max; j++) {
                            $('autopass-' + i_1 + '-' + j).checked = true;
                        }
                    }
                    if (allSame) {
                        $('autopass-all-' + firstValue).checked = true;
                    }
                }
            }
            var _loop_2 = function (faction) {
                var _loop_4 = function (i_2) {
                    dojo.connect($('autopass-' + faction + '-' + i_2), 'onclick', function () {
                        // Check only up to this
                        for (var j = 0; j <= 5; j++) {
                            $('autopass-all-' + j).checked = false;
                            $('autopass-' + faction + '-' + j).checked = j <= i_2;
                        }
                        _this.onUpdateAutopass();
                    });
                };
                for (var i_2 = 0; i_2 <= 5; i_2++) {
                    _loop_4(i_2);
                }
            };
            for (var faction = 0; faction < 5; faction++) {
                _loop_2(faction);
            }
            var _loop_3 = function (i_3) {
                dojo.connect($('autopass-all-' + i_3), 'onclick', function () {
                    // Check only this one
                    for (var j = 0; j <= 5; j++) {
                        $('autopass-all-' + j).checked = i_3 == j;
                    }
                    for (var faction = 0; faction < 5; faction++) {
                        for (var j = 0; j <= 5; j++) {
                            $('autopass-' + faction + '-' + j).checked = j <= i_3;
                        }
                    }
                    _this.onUpdateAutopass();
                });
            };
            for (var i_3 = 0; i_3 <= 5; i_3++) {
                _loop_3(i_3);
            }
        }
        this.allyDiscardCounter = new ebg.counter();
        this.allyDiscardCounter.create("ally-discard-size");
        this.allyDiscardCounter.setValue(gamedatas.allyDiscardSize);
        if (gamedatas.leviathanExpansion) {
            document.getElementById('threat-track').style.display = 'none';
        }
        this.organisePanelMessages();
        this.zoomManager = new ZoomManager({
            element: document.getElementById('table'),
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            zoomLevels: ZOOM_LEVELS,
            zoomControls: {
                color: 'white',
            },
            onZoomChange: function () { return onResize(); },
            //onDimensionsChange: () => this.onTableCenterSizeChange(),
        });
        // Setup game notifications to handle (see "setupNotifications" method below)
        this.setupNotifications();
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    Abyss.prototype.onEnteringState = function (stateName, args) {
        var _this = this;
        var _a;
        log('onEnteringState', stateName, args.args);
        // Remove all current move indicators
        dojo.query('.card-current-move').removeClass('card-current-move');
        if (this.isCurrentPlayerActive()) {
            if (this.checkPossibleActions('explore')) {
                dojo.query('#explore-track-deck').addClass('card-current-move');
            }
            if (this.checkPossibleActions('exploreTake') || this.checkPossibleActions('purchase')) {
                for (var i = 5; i >= 1; i--) {
                    var qr = dojo.query("#visible-allies-stock [data-slot-id=\"".concat(i, "\"] .ally"));
                    if (qr.length > 0) {
                        qr.addClass('card-current-move');
                        break;
                    }
                }
            }
            if (this.gamedatas.gamestate.name == 'placeKraken') {
                this.allyManager.getCardElement(args.args.ally).classList.add('card-current-move');
                dojo.query('#council-track .ally-back').addClass('card-current-move');
            }
            if (this.checkPossibleActions('requestSupport')) {
                dojo.query('#council-track .ally-back').addClass('card-current-move');
            }
            if (this.checkPossibleActions('recruit')) {
                // If affordableLords given, then highlight only affordable lords
                if (args.args && args.args._private && args.args._private.affordableLords) {
                    (_a = args.args._private.affordableLords) === null || _a === void 0 ? void 0 : _a.forEach(function (lord) {
                        var div = _this.lordManager.getCardElement(lord);
                        div.classList.add('card-current-move');
                    });
                }
                else {
                    dojo.query('#lords-track .lord:not(.lord-back)').addClass('card-current-move');
                }
            }
            if (this.checkPossibleActions('chooseLocation') && stateName != 'locationEffectBlackSmokers') {
                dojo.query('#locations-holder .location:not(.location-back)').addClass('card-current-move');
                dojo.query('#locations-holder-overflow .location:not(.location-back)').addClass('card-current-move');
            }
        }
        switch (stateName) {
            case 'recruitPay':
                this.onEnteringRecruitPay(args.args);
                break;
            case 'lord7':
                this.onEnteringLord7();
                break;
            case 'controlPostDraw':
                this.onEnteringControlPostDraw(args.args);
            // then do entering control code
            case 'control':
                this.onEnteringControl(args.args);
                break;
            case 'locationEffectBlackSmokers':
                this.onEnteringLocationEffectBlackSmokers(args.args);
                break;
            case 'purchase':
            case 'explore':
            case 'explore2':
            case 'explore3':
                this.onEnteringPurchaseExplore(args.args);
                break;
            case 'lord112':
                this.onEnteringLord112(args.args);
                break;
            case 'lord114multi':
                this.onEnteringLord114multi(args.args);
                break;
            case 'lord116':
                this.onEnteringLord116(args.args);
                break;
            case 'placeSentinel':
                this.onEnteringPlaceSentinel(args.args);
                break;
        }
    };
    Abyss.prototype.onEnteringRecruitPay = function (args) {
        var _a;
        // highlight the given lord
        (_a = this.lordManager.getCardElement(args.lord)) === null || _a === void 0 ? void 0 : _a.classList.add('selected');
    };
    Abyss.prototype.onEnteringLord7 = function () {
        // Put a red border around the player monster tokens (who aren't me)
        if (this.isCurrentPlayerActive()) {
            for (var player_id in this.gamedatas.players) {
                if (player_id != this.player_id) {
                    if (this.gamedatas.leviathanExpansion) {
                        document.getElementById("monster-hand_p".concat(player_id)).classList.add("clickable");
                    }
                    else {
                        dojo.query("#cp_board_p" + player_id + " .icon.icon-monster").addClass("clickable");
                    }
                }
            }
        }
    };
    Abyss.prototype.onEnteringLord112 = function (args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            dojo.place('<div id="ally-discard"></div>', 'game-extra');
            dojo.style($('game-extra'), "display", "block");
            var stock = new LineStock(this.allyManager, document.getElementById("ally-discard"));
            stock.addCards(args.allies);
            args.allies.filter(function (ally) { return ally.faction === null; }).forEach(function (monster) { var _a; return (_a = _this.allyManager.getCardElement(monster)) === null || _a === void 0 ? void 0 : _a.classList.add('disabled'); });
            stock.onCardClick = function (ally) { return _this.takeAllyFromDiscard(ally.ally_id); };
        }
    };
    Abyss.prototype.onEnteringLord114multi = function (args) {
        // Put a border around selectable allies
        if (this.isCurrentPlayerActive()) {
            Array.from(document.querySelectorAll(".affiliated .ally[data-faction=\"".concat(args.faction, "\"]"))).forEach(function (elem) { return elem.classList.add('card-current-move'); });
        }
    };
    Abyss.prototype.onEnteringLord116 = function (args) {
        var _this = this;
        // Put a green border around selectable lords
        if (this.isCurrentPlayerActive()) {
            args.lords.forEach(function (lord) {
                return _this.lordManager.getCardElement(lord).classList.add('selectable');
            });
        }
    };
    Abyss.prototype.onEnteringPlaceSentinel = function (args) {
        var _this = this;
        // Put a green border around selectable lords
        if (this.isCurrentPlayerActive()) {
            console.log(args);
            if (args.possibleOnLords) {
                this.visibleLords.getCards().forEach(function (lord) { return _this.lordManager.getCardElement(lord).classList.add('card-current-move'); });
            }
            if (args.possibleOnCouncil) {
                [0, 1, 2, 3, 4].forEach(function (faction) { return document.getElementById("council-track-".concat(faction)).classList.add('card-current-move'); });
            }
            if (args.possibleOnLocations) {
                __spreadArray(__spreadArray([], this.visibleLocations.getCards(), true), this.visibleLocationsOverflow.getCards(), true).forEach(function (location) { return _this.locationManager.getCardElement(location).classList.add('card-current-move'); });
            }
        }
    };
    Abyss.prototype.onEnteringControlPostDraw = function (args) {
        var _this = this;
        // Fade out the locations you can't buy
        if (this.isCurrentPlayerActive()) {
            dojo.query("#locations-holder .location:not(.location-back)").addClass("unavailable");
            dojo.query("#locations-holder-overflow .location:not(.location-back)").addClass("unavailable");
            args.location_ids.forEach(function (location_id) {
                return _this.locationManager.getCardElement({ location_id: location_id }).classList.remove('unavailable');
            });
        }
    };
    Abyss.prototype.onEnteringControl = function (args) {
        var _this = this;
        dojo.query(".free-lords .lord").removeClass("selected");
        args.default_lord_ids.forEach(function (lord_id) { return _this.lordManager.getCardElement({ lord_id: lord_id }).classList.add('selected'); });
    };
    Abyss.prototype.onEnteringLocationEffectBlackSmokers = function (args) {
        var _this = this;
        // Draw all the locations in a div at the top. Register to each an onclick to select it.
        if (this.isCurrentPlayerActive()) {
            dojo.place('<div id="ally-discard"></div>', 'game-extra');
            dojo.style($('game-extra'), "display", "block");
            var stock = new LineStock(this.locationManager, document.getElementById("ally-discard"), {
                direction: 'column',
            });
            stock.addCards(args._private.locations);
            stock.onCardClick = function (location) { return _this.onVisibleLocationClick(location); };
        }
    };
    Abyss.prototype.onEnteringPurchaseExplore = function (args) {
        // Disable players who have passed
        this.enableAllPlayerPanels();
        for (var iPlayer in args.passed_players) {
            this.disablePlayerPanel(args.passed_players[iPlayer]);
        }
        // Underline the first player
        var first_player = args.first_player;
        dojo.query('a', $('player_name_' + first_player)).style('text-decoration', 'underline');
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    Abyss.prototype.onLeavingState = function (stateName) {
        log('onLeavingState', stateName);
        $('game-extra').innerHTML = '';
        dojo.style($('game-extra'), "display", "none");
        switch (stateName) {
            case 'recruitPay':
                dojo.query("#lords-track .lord").removeClass("selected");
                dojo.query("#player-hand .ally").removeClass("selected");
                break;
            case 'lord7':
                // Put a red border around the player monster tokens (who aren't me)
                if (this.gamedatas.leviathanExpansion) {
                    document.querySelectorAll(".monster-hand.clickable").forEach(function (elem) { return elem.classList.remove("clickable"); });
                }
                else {
                    dojo.query(".cp_board .icon.icon-monster").removeClass("clickable");
                }
                break;
            case 'controlPostDraw':
            case 'control':
                dojo.query("#locations-holder .location").removeClass("unavailable");
                dojo.query("#locations-holder-overflow .location").removeClass("unavailable");
            case 'lord19':
            case 'lord19b':
                dojo.query(".free-lords .lord").removeClass("selected");
                break;
            case 'purchase':
            case 'explore':
            case 'explore2':
            case 'explore3':
                this.enableAllPlayerPanels();
                dojo.query('.player-name a').style('text-decoration', '');
                break;
            case 'lord116':
                this.onLeavingLord116();
                break;
        }
    };
    Abyss.prototype.onLeavingLord116 = function () {
        dojo.query(".lord.selectable").removeClass('selectable');
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Abyss.prototype.onUpdateActionButtons = function (stateName, args) {
        //log('onUpdateActionButtons', stateName, args);
        var _this = this;
        if (this.isCurrentPlayerActive() && ["plotAtCourt", "action", "secondStack", "explore", "explore2", "explore3", "chooseMonsterReward", "recruitPay", "affiliate", "cleanupDiscard", "controlPostDraw", "unusedLords"].includes(stateName)) {
            dojo.query("#player-panel-" + this.player_id + " .free-lords .lord").forEach(function (node) {
                // unused, and unturned...
                var used = +dojo.attr(node, "data-used");
                var turned = +dojo.attr(node, "data-turned");
                var effect = +dojo.attr(node, "data-effect");
                if (!used && !turned && effect == 3) {
                    dojo.addClass(node, "unused");
                }
            });
        }
        else {
            dojo.query(".lord").removeClass("unused");
        }
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'purchase':
                    var purchageArgs_1 = args;
                    var cost_1 = purchageArgs_1.cost;
                    this.addActionButton('button_purchase', _('Purchase') + " (".concat(cost_1, " <i class=\"icon icon-pearl\"></i>)"), function () { return _this.onPurchase(0); });
                    if (!purchageArgs_1.canPayWithPearls) {
                        document.getElementById('button_purchase').classList.add('disabled');
                    }
                    if (purchageArgs_1.withNebulis) {
                        Object.keys(purchageArgs_1.withNebulis).forEach(function (i) {
                            _this.addActionButton("button_purchase_with".concat(i, "Nebulis"), _('Purchase') + " (".concat(cost_1 - Number(i) > 0 ? "".concat(cost_1 - Number(i), " <i class=\"icon icon-pearl\"></i> ") : '').concat(i, " <i class=\"icon icon-nebulis\"></i>)"), function (event) { return _this.onPurchase(Number(i)); });
                            if (!purchageArgs_1.withNebulis[i]) {
                                document.getElementById("button_purchase_with".concat(i, "Nebulis")).classList.add('disabled');
                            }
                        });
                    }
                    this.addActionButton('button_pass', _('Pass'), 'onPass');
                    break;
                case 'explore':
                    var exploreArgs_1 = args;
                    if (exploreArgs_1.monster && this.gamedatas.leviathanExpansion) {
                        this.addActionButton('button_fightMonster', _('Fight the Monster'), function () { return _this.exploreTake(exploreArgs_1.ally.place); });
                        this.addActionButton('button_keepExploring', _('Keep exploring'), function () { return _this.exploreDeck(); }, null, null, 'red');
                    }
                    break;
                case 'chooseMonsterReward':
                    for (var i in args.rewards) {
                        var r = args.rewards[i];
                        r = r.replace(/K/g, "<i class=\"icon icon-key\"></i>");
                        r = r.replace(/P/g, "<i class=\"icon icon-pearl\"></i>");
                        r = r.replace(/M/g, "<i class=\"icon icon-monster\"></i>");
                        this.addActionButton('button_reward_' + i, r, 'onChooseMonsterReward');
                    }
                    break;
                case 'recruitPay':
                    var recruitArgs = args;
                    this.addActionButton('button_recruit', _('Recruit'), function () { return _this.onRecruit(0); });
                    if (recruitArgs.withNebulis) {
                        Object.keys(recruitArgs.withNebulis).forEach(function (i) {
                            _this.addActionButton("button_recruit_with".concat(i, "Nebulis"), _('Recruit') + " (".concat(args.cost - Number(i) > 0 ? "".concat(args.cost - Number(i), " <i class=\"icon icon-pearl\"></i> ") : '').concat(i, " <i class=\"icon icon-nebulis\"></i>)"), function () { return _this.onRecruit(Number(i)); });
                        });
                    }
                    this.updateRecruitButtonsState(recruitArgs);
                    this.addActionButton('button_pass', _('Cancel'), function (event) { return _this.onPass(event); });
                    break;
                case 'affiliate':
                    for (var i in args.allies) {
                        var ally = args.allies[i];
                        var r = ally.value + ' ' + this.allyManager.allyNameText(ally.faction);
                        var btnId = 'button_affiliate_' + ally.ally_id;
                        this.addActionButton(btnId, r, 'onChooseAffiliate');
                        dojo.addClass($(btnId), 'affiliate-button');
                    }
                    //(this as any).addActionButton('cancelRecruit_button', _('Cancel'), () => this.cancelRecruit(), null, null, 'gray');
                    break;
                case 'plotAtCourt':
                    this.addActionButton('button_plot', _('Plot') + " (1 <i class=\"icon icon-pearl\"></i>)", 'onPlot');
                    if (args.canPlaceSentinel) {
                        this.addActionButton('button_place_sentinel', _('Place sentinel'), function () { return _this.goToPlaceSentinel(); });
                    }
                    this.addActionButton('button_pass', _('Pass'), 'onPass');
                    break;
                case 'action':
                    if (args.canPlaceSentinel) {
                        this.addActionButton('button_place_sentinel', _('Place sentinel'), function () { return _this.goToPlaceSentinel(); });
                    }
                    break;
                case 'lord23':
                case 'lord26':
                case 'locationEffectBlackSmokers':
                case 'lord19':
                case 'lord22':
                case 'lord19b':
                case 'unusedLords':
                    this.addActionButton('button_pass', _('Pass'), 'onPass');
                    break;
                case 'lord12':
                case 'lord17':
                case 'lord21':
                    this.addActionButton('button_pass', _('Cancel'), 'onPass');
                    break;
                case 'lord2':
                case 'lord5':
                case 'cleanupDiscard':
                case 'postpurchaseDiscard':
                    this.addActionButton('button_discard', _('Discard'), 'onDiscard');
                    break;
                case 'lord7':
                    if (!this.gamedatas.leviathanExpansion) {
                        var _loop_5 = function () {
                            var playerId = Number(player_id);
                            if (playerId != this_1.getPlayerId()) {
                                num_tokens = this_1.monsterCounters[playerId].getValue();
                                if (num_tokens > 0) {
                                    this_1.addActionButton("button_steal_monster_token_".concat(playerId), this_1.gamedatas.players[playerId].name, function () { return _this.onClickMonsterIcon(playerId); });
                                    document.getElementById("button_steal_monster_token_".concat(playerId)).style.border = "3px solid #".concat(this_1.gamedatas.players[playerId].color);
                                }
                            }
                        };
                        var this_1 = this, num_tokens;
                        // Put a red border around the player monster tokens (who aren't me)
                        for (var player_id in this.gamedatas.players) {
                            _loop_5();
                        }
                    }
                    break;
                case 'control':
                    var s = _('Draw ${n}');
                    var location_deck = dojo.query('.location.location-back')[0];
                    var location_deck_size = +dojo.attr(location_deck, 'data-size');
                    for (var i_4 = 1; i_4 <= 4; i_4++) {
                        if (location_deck_size < i_4)
                            continue;
                        this.addActionButton('button_draw_' + i_4, dojo.string.substitute(s, { n: i_4 }), 'onDrawLocation');
                    }
                    break;
                case 'martialLaw':
                    var martialLawArgs = args;
                    if ((martialLawArgs === null || martialLawArgs === void 0 ? void 0 : martialLawArgs.diff) > 0) {
                        this.addActionButton('button_discard', _('Discard selected allies'), function () { return _this.onDiscard(); });
                        var ally_ids = [];
                        dojo.query("#player-hand .ally.selected").forEach(function (node) {
                            return ally_ids.push(+dojo.attr(node, 'data-ally-id'));
                        });
                        if (!ally_ids.length) {
                            document.getElementById('button_discard').classList.add('disabled');
                        }
                        this.addActionButton('button_payMartialLaw', _('Pay') + " ".concat(martialLawArgs.diff, " <i class=\"icon icon-pearl\"></i>"), function () { return _this.payMartialLaw(); });
                        if (!martialLawArgs.canPay) {
                            document.getElementById('button_payMartialLaw').classList.add('disabled');
                        }
                    }
                    break;
                case 'fillSanctuary':
                    this.addActionButton('button_continue', _('Continue searching'), function () { return _this.searchSanctuary(); });
                    this.addActionButton('button_stop', _('Stop searching'), function () { return _this.stopSanctuarySearch(); });
                    break;
                case 'lord104':
                    var lord104Args_1 = args;
                    if (lord104Args_1.nebulis == 1) {
                        lord104Args_1.playersIds.forEach(function (playerId) {
                            var player = _this.getPlayer(playerId);
                            _this.addActionButton("giveNebulisTo".concat(playerId, "-button"), player.name, function () { return _this.giveNebulisTo([playerId]); });
                            document.getElementById("giveNebulisTo".concat(playerId, "-button")).style.border = "3px solid #".concat(player.color);
                        });
                    }
                    else {
                        lord104Args_1.playersIds.forEach(function (playerId) {
                            lord104Args_1.playersIds.filter(function (secondPlayerId) { return secondPlayerId != playerId; }).forEach(function (secondPlayerId) {
                                var player = _this.getPlayer(playerId);
                                var secondPlayer = _this.getPlayer(secondPlayerId);
                                if (!document.getElementById("giveNebulisTo".concat(playerId, "-").concat(secondPlayerId, "-button")) && !document.getElementById("giveNebulisTo".concat(secondPlayerId, "-").concat(playerId, "-button"))) {
                                    _this.addActionButton("giveNebulisTo".concat(playerId, "-").concat(secondPlayerId, "-button"), _('${player_name} and ${player_name2}').replace('${player_name}', player.name).replace('${player_name2}', secondPlayer.name), function () { return _this.giveNebulisTo([playerId, secondPlayerId]); });
                                }
                            });
                        });
                    }
                    break;
                case 'lord114':
                    var _loop_6 = function (i_5) {
                        this_2.addActionButton("selectAllyRace".concat(i_5), this_2.allyManager.allyNameText(i_5), function () { return _this.selectAllyRace(i_5); });
                        document.getElementById("selectAllyRace".concat(i_5)).classList.add('affiliate-button');
                    };
                    var this_2 = this;
                    for (var i_5 = 0; i_5 < 5; i_5++) {
                        _loop_6(i_5);
                    }
                    break;
                case 'giveKraken':
                    var giveKrakenArgs = args;
                    giveKrakenArgs.playersIds.forEach(function (playerId) {
                        var player = _this.getPlayer(playerId);
                        _this.addActionButton("giveKraken".concat(playerId, "-button"), player.name, function () { return _this.giveKraken(playerId); });
                        document.getElementById("giveKraken".concat(playerId, "-button")).style.border = "3px solid #".concat(player.color);
                    });
                    break;
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    Abyss.prototype.setTooltip = function (id, html) {
        this.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    };
    Abyss.prototype.setTooltipToClass = function (className, html) {
        this.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    };
    Abyss.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    Abyss.prototype.getOpponentsIds = function (playerId) {
        return Object.keys(this.gamedatas.players).map(function (id) { return Number(id); }).filter(function (id) { return id != playerId; });
    };
    Abyss.prototype.getPlayer = function (playerId) {
        return Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) == playerId; });
    };
    Abyss.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    Abyss.prototype.getCurrentPlayerTable = function () {
        var _this = this;
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === _this.getPlayerId(); });
    };
    Abyss.prototype.organisePanelMessages = function () {
        this.playersTables.forEach(function (playerTable) { return playerTable.organisePanelMessages(); });
    };
    Abyss.prototype.setDeckSize = function (deck /*dojo query result*/, num) {
        deck.removeClass("deck-empty deck-low deck-medium deck-full");
        if (num == 0) {
            deck.addClass("deck-empty");
        }
        else if (num <= 2) {
            deck.addClass("deck-low");
        }
        else if (num <= 5) {
            deck.addClass("deck-medium");
        }
        else {
            deck.addClass("deck-full");
        }
        // Set deck-size data
        deck.attr("data-size", num);
        // If it's a council stack, then add tooltip
        for (var i = 0; i < deck.length; i++) {
            var node = deck[i];
            var deckSize = dojo.query('.deck-size', node);
            if (deckSize.length > 0) {
                var n = deckSize[0];
                n.innerHTML = num > 0 ? num : "";
            }
        }
    };
    Abyss.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var _a;
            var playerId = Number(player.id);
            // Setting up players boards if needed
            var player_board_div = $('player_board_' + playerId);
            var html = "\n            <div id=\"cp_board_p".concat(player.id, "\" class=\"cp_board\" data-player-id=\"").concat(player.id, "\">\n                <div class=\"counters\">\n                    <span class=\"pearl-holder\" id=\"pearl-holder_p").concat(player.id, "\">\n                        <i class=\"icon icon-pearl\"></i>\n                        <span id=\"pearlcount_p").concat(player.id, "\"></span>");
            if (gamedatas.krakenExpansion) {
                html += "<i class=\"icon icon-nebulis margin-left\"></i>\n                    <span id=\"nebuliscount_p".concat(player.id, "\"></span>");
            }
            html += "\n            </span>\n                    <span class=\"key-holder\" id=\"key-holder_p".concat(player.id, "\">\n                        <i class=\"icon icon-key\"></i>\n                        <span id=\"keycount_p").concat(player.id, "\">").concat(player.keys, "</span>\n                    </span>\n                    <span class=\"monster-holder\" id=\"monster-holder_p").concat(player.id, "\">\n                        <i id=\"icon-monster_p").concat(player.id, "\" class=\"icon icon-monster\"></i>\n                        <span id=\"monstercount_p").concat(player.id, "\"></span>\n                    </span>\n                </div>\n                <div class=\"counters\">\n                    <span class=\"ally-holder\" id=\"ally-holder_p").concat(player.id, "\">\n                        <i class=\"icon icon-ally\"></i>\n                        <span id=\"allycount_p").concat(player.id, "\"></span>\n                    </span>\n                    <span>\n                        <span class=\"lordcount-holder\" id=\"lordcount-holder_p").concat(player.id, "\">\n                            <i class=\"icon icon-lord\"></i>\n                            <span id=\"lordcount_p").concat(player.id, "\"></span>\n                        </span>\n                    </span>\n                ");
            if (gamedatas.leviathanExpansion) {
                html += "\n                    <span class=\"leviathan-holder\" id=\"leviathan-holder_p".concat(player.id, "\">\n                        <i class=\"icon leviathan-icon icon-wound\"></i>\n                        <span id=\"woundcount_p").concat(player.id, "\"></span>\n                        <i class=\"icon leviathan-icon icon-defeated-leviathan margin-left\"></i>\n                        <span id=\"defeatedleviathancount_p").concat(player.id, "\"></span>\n                    </span>\n                ");
            }
            html += "\n            </div>\n                <div class=\"monster-hand\" id=\"monster-hand_p".concat(player.id, "\"></div>\n            </div>");
            dojo.place(html, player_board_div);
            if (!gamedatas.leviathanExpansion) {
                document.getElementById("icon-monster_p".concat(playerId)).addEventListener('click', function () { return _this.onClickMonsterIcon(playerId); });
            }
            _this.pearlCounters[playerId] = new ebg.counter();
            _this.pearlCounters[playerId].create("pearlcount_p".concat(player.id));
            _this.pearlCounters[playerId].setValue(player.pearls);
            if (gamedatas.krakenExpansion) {
                _this.nebulisCounters[playerId] = new ebg.counter();
                _this.nebulisCounters[playerId].create("nebuliscount_p".concat(player.id));
                _this.nebulisCounters[playerId].setValue(player.nebulis);
            }
            _this.keyTokenCounts[playerId] = Number(player.keys);
            _this.keyFreeLordsCounts[playerId] = 0;
            _this.keyCounters[playerId] = new ebg.counter();
            _this.keyCounters[playerId].create("keycount_p".concat(player.id));
            _this.updateKeyCounter(playerId);
            _this.monsterCounters[playerId] = new ebg.counter();
            _this.monsterCounters[playerId].create("monstercount_p".concat(player.id));
            _this.monsterCounters[playerId].setValue(player.num_monsters);
            _this.allyCounters[playerId] = new ebg.counter();
            _this.allyCounters[playerId].create("allycount_p".concat(player.id));
            _this.allyCounters[playerId].setValue(player.hand_size);
            _this.lordCounters[playerId] = new ebg.counter();
            _this.lordCounters[playerId].create("lordcount_p".concat(player.id));
            _this.lordCounters[playerId].setValue(player.lords.length);
            if (gamedatas.leviathanExpansion) {
                _this.woundCounters[playerId] = new ebg.counter();
                _this.woundCounters[playerId].create("woundcount_p".concat(player.id));
                // TODO LEV this.woundCounters[playerId].setValue(player.wounds);
                _this.defeatedLeviathanCounters[playerId] = new ebg.counter();
                _this.defeatedLeviathanCounters[playerId].create("defeatedleviathancount_p".concat(player.id));
                // TODO LEV this.defeatedLeviathanCounters[playerId].setValue(player.defeatedLeviathans);
            }
            _this.monsterTokens[playerId] = new LineStock(_this.monsterManager, document.getElementById('monster-hand_p' + playerId), {
                center: false,
                gap: '2px',
            });
            _this.monsterTokens[playerId].onCardClick = function (card) { return _this.onClickMonsterIcon(playerId, card.type); };
            (_a = player.monsters) === null || _a === void 0 ? void 0 : _a.forEach(function (monster) {
                return _this.monsterTokens[playerId].addCards(player.monsters, undefined, {
                    visible: !!(monster.value || monster.effect)
                });
            });
            // kraken & scourge tokens
            dojo.place("<div id=\"player_board_".concat(player.id, "_figurinesWrapper\" class=\"figurinesWrapper\"></div>"), "player_board_".concat(player.id));
            if (gamedatas.kraken == playerId) {
                _this.placeFigurineToken(playerId, 'kraken');
            }
            if (gamedatas.scourge == playerId) {
                _this.placeFigurineToken(playerId, 'scourge');
            }
            // Set up scoring table in advance (helpful for testing!)
            var splitPlayerName = '';
            var chars = player.name.split("");
            for (var i in chars) {
                splitPlayerName += "<span>".concat(chars[i], "</span>");
            }
            $('scoring-row-players').innerHTML += "<td><span id=\"scoring-row-name-p".concat(playerId, "\" style=\"color:#").concat(player.color, ";\"><span>").concat(splitPlayerName, "</span></span></td>");
            $('scoring-row-location').innerHTML += "<td id=\"scoring-row-location-p".concat(playerId, "\"></td>");
            $('scoring-row-lord').innerHTML += "<td id=\"scoring-row-lord-p".concat(playerId, "\"></td>");
            $('scoring-row-affiliated').innerHTML += "<td id=\"scoring-row-affiliated-p".concat(playerId, "\"></td>");
            $('scoring-row-monster').innerHTML += "<td id=\"scoring-row-monster-p".concat(playerId, "\"></td>");
            if (gamedatas.krakenExpansion) {
                $('scoring-row-nebulis').innerHTML += "<td id=\"scoring-row-nebulis-p".concat(playerId, "\"></td>");
                $('scoring-row-kraken').innerHTML += "<td id=\"scoring-row-kraken-p".concat(playerId, "\"></td>");
            }
            if (gamedatas.leviathanExpansion) {
                $('scoring-row-wound').innerHTML += "<td id=\"scoring-row-wound-p".concat(playerId, "\"></td>");
                $('scoring-row-scourge').innerHTML += "<td id=\"scoring-row-scourge-p".concat(playerId, "\"></td>");
            }
            $('scoring-row-total').innerHTML += "<td id=\"scoring-row-total-p".concat(playerId, "\"></td>");
        });
    };
    Abyss.prototype.updateKeyCounter = function (playerId) {
        this.keyCounters[playerId].setValue(this.keyTokenCounts[playerId] + this.keyFreeLordsCounts[playerId]);
        this.setTooltip("key-holder_p".concat(playerId), _('Keys (${keyTokens} key token(s) + ${keyFreeLords} key(s) from free Lords)')
            .replace('${keyTokens}', this.keyTokenCounts[playerId])
            .replace('${keyFreeLords}', this.keyFreeLordsCounts[playerId]));
    };
    Abyss.prototype.setPearlCount = function (playerId, count) {
        this.pearlCounters[playerId].setValue(count);
    };
    Abyss.prototype.setNebulisCount = function (playerId, count) {
        var _a;
        (_a = this.nebulisCounters[playerId]) === null || _a === void 0 ? void 0 : _a.setValue(count);
    };
    Abyss.prototype.incMonsterCount = function (playerId, inc) {
        this.monsterCounters[playerId].setValue(this.monsterCounters[playerId].getValue() + inc);
    };
    Abyss.prototype.incAllyCount = function (playerId, inc) {
        this.allyCounters[playerId].setValue(this.allyCounters[playerId].getValue() + inc);
    };
    Abyss.prototype.incLordCount = function (playerId, inc) {
        this.lordCounters[playerId].setValue(this.lordCounters[playerId].getValue() + inc);
    };
    Abyss.prototype.placeFigurineToken = function (playerId, type) {
        var figurineToken = document.getElementById("".concat(type, "Token"));
        if (figurineToken) {
            if (playerId == 0) {
                this.fadeOutAndDestroy(figurineToken);
            }
            else {
                var parentElement = figurineToken.parentElement;
                document.getElementById("player_board_".concat(playerId, "_figurinesWrapper")).appendChild(figurineToken);
                stockSlideAnimation({
                    element: figurineToken,
                    fromElement: parentElement
                });
            }
        }
        else {
            if (playerId != 0) {
                dojo.place("<div id=\"".concat(type, "Token\" class=\"token\"></div>"), "player_board_".concat(playerId, "_figurinesWrapper"));
                var tooltip = null;
                if (type === 'kraken') {
                    tooltip = _("The Kraken figure allows players to identify, during the game, the most corrupt player. The figure is given to the first player to receive any Nebulis. As soon as an opponent ties or gains more Nebulis than the most corrupt player, they get the Kraken figure");
                }
                else if (type === 'scourge') {
                    // TODO LEV tooltip = _("If you are the first player to kill a Leviathan, take the Scourge of the Abyss. As soon as an opponent reaches or exceeds the number of Leviathans killed by the most valorous defender, they take the statue from the player who currently holds it. The player who owns the statue at the end of the game gains 5 Influence Points.");
                }
                if (tooltip) {
                    this.setTooltip("".concat(type, "Token"), tooltip);
                }
            }
        }
    };
    Abyss.prototype.getSentinelToken = function (playerId, lordId) {
        var div = document.getElementById("sentinel-".concat(lordId));
        if (!div) {
            div = document.createElement('div');
            div.id = "sentinel-".concat(lordId);
            div.classList.add('sentinel-token');
            div.dataset.lordId = "".concat(lordId);
            div.dataset.currentPlayer = (playerId == this.getPlayerId()).toString();
        }
        return div;
    };
    Abyss.prototype.placeSentinelToken = function (playerId, lordId, location, locationArg) {
        var sentinel = this.getSentinelToken(playerId, lordId);
        var parentElement = sentinel.parentElement;
        switch (location) {
            case 'player':
                var sentinelsElement = document.getElementById("player-panel-".concat(playerId, "-sentinels"));
                sentinelsElement.appendChild(sentinel);
                if (parentElement) {
                    stockSlideAnimation({
                        element: sentinel,
                        fromElement: parentElement
                    });
                }
                break;
            case 'lord':
                var lordElement = this.lordManager.getCardElement({ lord_id: locationArg });
                lordElement.appendChild(sentinel);
                if (parentElement) {
                    stockSlideAnimation({
                        element: sentinel,
                        fromElement: parentElement
                    });
                }
                break;
            case 'council':
                var councilElement = document.getElementById("council-track-".concat(locationArg));
                councilElement.appendChild(sentinel);
                if (parentElement) {
                    stockSlideAnimation({
                        element: sentinel,
                        fromElement: parentElement
                    });
                }
                break;
            case 'location':
                var locationElement = this.locationManager.getCardElement({ location_id: locationArg });
                locationElement.appendChild(sentinel);
                if (parentElement) {
                    stockSlideAnimation({
                        element: sentinel,
                        fromElement: parentElement
                    });
                }
                break;
        }
    };
    Abyss.prototype.organiseLocations = function () {
        // If on playmat:
        if (dojo.hasClass($('game-board-holder'), "playmat")) {
            // move all beyond 5 into the overflow
            var locations = this.visibleLocations.getCards();
            if (locations.length > 5) {
                this.visibleLocationsOverflow.addCards(locations.slice(5));
            }
        }
        else {
            var locations = this.visibleLocationsOverflow.getCards();
            if (locations.length > 0) {
                this.visibleLocations.addCards(locations);
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Player's action
    /*

        Here, you are defining methods to handle player's action (ex: results of mouse click on
        game objects).

        Most of the time, these methods:
        _ check the action is possible at this game state.
        _ make a call to the game server

    */
    Abyss.prototype.onDiscard = function () {
        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(function (node) {
            return ally_ids.push(+dojo.attr(node, 'data-ally-id'));
        });
        this.discardAllies(ally_ids);
    };
    Abyss.prototype.onRecruit = function (withNebulis) {
        if (!this.checkAction('pay')) {
            return;
        }
        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(function (node) {
            ally_ids.push(+dojo.attr(node, 'data-ally-id'));
        });
        this.takeAction('pay', {
            ally_ids: ally_ids.join(';'),
            withNebulis: withNebulis,
        });
    };
    Abyss.prototype.onChooseAffiliate = function (evt) {
        if (!this.checkAction('affiliate')) {
            return;
        }
        var ally_id = +evt.currentTarget.id.replace('button_affiliate_', '');
        this.takeAction('affiliate', {
            ally_id: ally_id,
        });
    };
    Abyss.prototype.cancelRecruit = function () {
        if (!this.checkAction('cancelRecruit')) {
            return;
        }
        this.takeAction('cancelRecruit');
    };
    Abyss.prototype.onClickCouncilTrack = function (evt) {
        if (dojo.hasClass(evt.target, 'ally')) {
            // Draw this stack??
            dojo.stopEvent(evt);
            var faction = dojo.attr(evt.target, 'data-faction');
            if (this.gamedatas.gamestate.name === 'placeSentinel') {
                this.placeSentinel(2, faction);
                return;
            }
            else if (this.gamedatas.gamestate.name === 'placeKraken') {
                this.placeKraken(faction);
                return;
            }
            if (!this.checkAction('requestSupport')) {
                return;
            }
            this.takeAction('requestSupport', {
                faction: faction,
            });
        }
    };
    Abyss.prototype.onClickPlayerLocation = function (location) {
        var target = this.locationManager.getCardElement(location);
        if (!dojo.hasClass(target, 'location-back')) {
            if (this.gamedatas.gamestate.name === 'placeSentinel') {
                this.placeSentinel(3, location.location_id);
                return;
            }
            if (!this.checkAction('chooseLocation')) {
                return;
            }
            // If you select Black Smokers with an empty deck, warn!
            if (location.location_id == 10) {
                var location_deck = dojo.query('.location.location-back')[0];
                var location_deck_size = +dojo.attr(location_deck, 'data-size');
                if (location_deck_size == 0) {
                    this.confirmationDialog(_('Are you sure you want to select this Location? There are no Locations left in the deck.'), dojo.hitch(this, function () {
                        this.chooseLocation(location.location_id);
                    }));
                    return;
                }
            }
            this.chooseLocation(location.location_id);
        }
    };
    Abyss.prototype.onVisibleLocationClick = function (location) {
        var location_id = location.location_id;
        if (this.gamedatas.gamestate.name === 'placeSentinel') {
            this.placeSentinel(3, location_id);
            return;
        }
        if (!this.checkAction('chooseLocation')) {
            return;
        }
        // If you select Black Smokers with an empty deck, warn!
        if (location_id == 10) {
            var location_deck = dojo.query('.location.location-back')[0];
            var location_deck_size = +dojo.attr(location_deck, 'data-size');
            if (location_deck_size == 0) {
                this.confirmationDialog(_('Are you sure you want to select this Location? There are no Locations left in the deck.'), dojo.hitch(this, function () {
                    this.chooseLocation(location_id);
                }));
                return;
            }
        }
        this.chooseLocation(location_id);
    };
    Abyss.prototype.chooseLocation = function (locationId) {
        var _this = this;
        var lord_ids = this.getCurrentPlayerTable().getFreeLords(true)
            .filter(function (lord) { return _this.lordManager.getCardElement(lord).classList.contains('selected'); })
            .map(function (lord) { return lord.lord_id; });
        this.takeAction('chooseLocation', {
            location_id: locationId,
            lord_ids: lord_ids.join(';'),
        });
    };
    Abyss.prototype.onVisibleLordClick = function (lord) {
        if (this.gamedatas.gamestate.name === 'placeSentinel') {
            this.placeSentinel(1, lord.lord_id);
        }
        else {
            this.recruit(lord.lord_id);
        }
    };
    Abyss.prototype.recruit = function (lordId) {
        if (!this.checkAction('recruit')) {
            return;
        }
        this.takeAction('recruit', {
            lord_id: lordId,
        });
    };
    Abyss.prototype.onClickExploreDeck = function (evt) {
        dojo.stopEvent(evt);
        this.exploreDeck();
    };
    Abyss.prototype.exploreDeck = function () {
        if (!this.checkAction('explore')) {
            return;
        }
        this.takeAction('explore');
    };
    Abyss.prototype.onVisibleAllyClick = function (ally) {
        if (this.checkAction('purchase', true)) {
            this.onPurchase(0); // TODO BGA ?
            return;
        }
        this.exploreTake(ally.place);
    };
    Abyss.prototype.exploreTake = function (slot) {
        if (!this.checkAction('exploreTake')) {
            return;
        }
        this.takeAction('exploreTake', {
            slot: slot,
        });
    };
    Abyss.prototype.onPurchase = function (withNebulis) {
        if (!this.checkAction('purchase')) {
            return;
        }
        this.takeAction('purchase', {
            withNebulis: withNebulis
        });
    };
    Abyss.prototype.onPass = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('pass')) {
            return;
        }
        this.takeAction('pass');
    };
    Abyss.prototype.onPlot = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('plot')) {
            return;
        }
        this.takeAction('plot');
    };
    Abyss.prototype.onChooseMonsterReward = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('chooseReward')) {
            return;
        }
        var option = +evt.currentTarget.id.replace("button_reward_", '');
        this.takeAction('chooseReward', {
            option: option,
        });
    };
    Abyss.prototype.updateRecruitButtonsState = function (args) {
        var playerPearls = args.pearls;
        var playerNebulis = args.nebulis;
        // const diversity = args.lord.diversity;
        var selectedAllies = this.getCurrentPlayerTable().getSelectedAllies();
        var value = selectedAllies.map(function (ally) { return ally.value; }).reduce(function (a, b) { return Number(a) + Number(b); }, 0);
        // const krakens = selectedAllies.filter(ally => ally.faction == 10).length;
        var shortfall = Math.max(0, args.cost - value);
        // console.log(args, value, shortfall);
        // Update "Recruit" button
        var recruitButton = document.getElementById('button_recruit');
        recruitButton.innerHTML = _('Recruit') + ' (' + shortfall + ' <i class="icon icon-pearl"></i>)';
        recruitButton.classList.toggle('disabled', shortfall > playerPearls);
        [1, 2].forEach(function (i) {
            var button = document.getElementById("button_recruit_with".concat(i, "Nebulis"));
            if (button) {
                var cost = shortfall;
                button.innerHTML = _('Recruit') + " (".concat(cost - i > 0 ? "".concat(cost - i, " <i class=\"icon icon-pearl\"></i> ") : '').concat(i, " <i class=\"icon icon-nebulis\"></i>)");
                var canPayShortFallWithNebulis = playerNebulis >= i && playerPearls >= (cost - i) && i <= shortfall;
                if (canPayShortFallWithNebulis && !args.canAlwaysUseNebulis && playerPearls != cost - i) {
                    canPayShortFallWithNebulis = false;
                }
                button.classList.toggle('disabled', !canPayShortFallWithNebulis);
            }
        });
    };
    Abyss.prototype.onClickPlayerHand = function (ally) {
        if (this.checkAction('pay', true)) {
            this.allyManager.getCardElement(ally).classList.toggle('selected');
            this.updateRecruitButtonsState(this.gamedatas.gamestate.args);
        }
        else if (this.checkAction('discard', true)) {
            // Multi-discard: select, otherwise just discard this one
            this.allyManager.getCardElement(ally).classList.toggle('selected');
            if (this.gamedatas.gamestate.name === 'martialLaw') {
                var ally_ids = [];
                dojo.query("#player-hand .ally.selected").forEach(function (node) {
                    return ally_ids.push(+dojo.attr(node, 'data-ally-id'));
                });
                document.getElementById('button_discard').classList.toggle('disabled', !ally_ids.length);
            }
            // Discard this card directly?
            // var ally_id = dojo.attr(evt.target, 'data-ally-id');
            // (this as any).ajaxcall( "/abyss/abyss/discard.html", { lock: true, ally_ids: ally_id }, this,
            //   function( result ) {},
            //   function( is_error) {}
            // );
        }
        else if (this.checkAction('selectAlly', true)) {
            this.takeAction('selectAlly', {
                ally_id: ally.ally_id
            });
        }
    };
    Abyss.prototype.onClickMonsterIcon = function (playerId, type) {
        if (type === void 0) { type = 0; }
        if (this.checkAction('chooseMonsterTokens')) {
            console.log(playerId);
            this.takeAction('chooseMonsterTokens', {
                player_id: playerId,
                type: type,
            });
        }
    };
    Abyss.prototype.onClickPlayerFreeLord = function (lord) {
        if (this.checkAction('selectLord', true)) {
            this.takeAction('selectLord', {
                lord_id: lord.lord_id
            });
        }
        else if (this.checkAction('lordEffect', true)) {
            this.takeAction('lordEffect', {
                lord_id: lord.lord_id
            });
        }
        else if (this.checkAction('chooseLocation', true)) {
            var target = this.lordManager.getCardElement(lord);
            // Only allow this on your own Lords
            var panel = target.closest('.player-panel');
            if (panel.id == "player-panel-" + this.getPlayerId()) {
                dojo.toggleClass(target, "selected");
            }
        }
    };
    Abyss.prototype.onClickPlayerLockedLord = function (lord) {
        var target = this.lordManager.getCardElement(lord);
        if (target.classList.contains('selectable') && this.gamedatas.gamestate.name === 'lord116') {
            this.freeLord(lord.lord_id);
            return;
        }
    };
    Abyss.prototype.onUpdateAutopass = function () {
        var autopass = "";
        for (var faction = 0; faction < 5; faction++) {
            var max = 0;
            for (var j = 0; j <= 5; j++) {
                if ($('autopass-' + faction + '-' + j).checked) {
                    max = j;
                }
                else {
                    break;
                }
            }
            if (autopass.length > 0) {
                autopass += ";";
            }
            autopass += "" + max;
        }
        this.takeNoLockAction('setAutopass', {
            autopass: autopass,
        });
    };
    Abyss.prototype.onDrawLocation = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('drawLocations')) {
            return;
        }
        var num = +evt.currentTarget.id.replace('button_draw_', '');
        this.takeAction('drawLocations', {
            num: num,
        });
    };
    Abyss.prototype.payMartialLaw = function () {
        if (!this.checkAction('payMartialLaw')) {
            return;
        }
        this.takeAction('payMartialLaw');
    };
    Abyss.prototype.searchSanctuary = function () {
        if (!this.checkAction('searchSanctuary')) {
            return;
        }
        this.takeAction('searchSanctuary');
    };
    Abyss.prototype.stopSanctuarySearch = function () {
        if (!this.checkAction('stopSanctuarySearch')) {
            return;
        }
        this.takeAction('stopSanctuarySearch');
    };
    Abyss.prototype.takeAllyFromDiscard = function (id) {
        if (!this.checkAction('takeAllyFromDiscard')) {
            return;
        }
        this.takeAction('takeAllyFromDiscard', {
            id: id,
        });
    };
    Abyss.prototype.freeLord = function (id) {
        if (!this.checkAction('freeLord')) {
            return;
        }
        this.takeAction('freeLord', {
            id: id,
        });
    };
    Abyss.prototype.selectAllyRace = function (faction) {
        if (!this.checkAction('selectAllyRace')) {
            return;
        }
        this.takeAction('selectAllyRace', {
            faction: faction,
        });
    };
    Abyss.prototype.discardAllies = function (ids) {
        if (!this.checkAction('discard')) {
            return;
        }
        this.takeAction('discard', {
            ally_ids: ids.join(';'),
        });
    };
    Abyss.prototype.giveKraken = function (playerId) {
        if (!this.checkAction('giveKraken')) {
            return;
        }
        this.takeAction('giveKraken', {
            playerId: playerId,
        });
    };
    Abyss.prototype.goToPlaceSentinel = function () {
        if (!this.checkAction('goToPlaceSentinel')) {
            return;
        }
        this.takeAction('goToPlaceSentinel');
    };
    Abyss.prototype.placeSentinel = function (location, locationArg) {
        if (!this.checkAction('placeSentinel')) {
            return;
        }
        this.takeAction('placeSentinel', {
            location: location,
            locationArg: locationArg,
        });
    };
    Abyss.prototype.giveNebulisTo = function (playersIds) {
        if (!this.checkAction('giveNebulisTo')) {
            return;
        }
        this.takeAction('giveNebulisTo', {
            playersIds: playersIds.join(';'),
        });
    };
    Abyss.prototype.placeKraken = function (faction) {
        if (!this.checkAction('placeKraken')) {
            return;
        }
        this.takeAction('placeKraken', {
            faction: faction
        });
    };
    Abyss.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/abyss/abyss/".concat(action, ".html"), data, this, function () { });
    };
    Abyss.prototype.takeNoLockAction = function (action, data) {
        data = data || {};
        this.ajaxcall("/abyss/abyss/".concat(action, ".html"), data, this, function () { });
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your abyss.game.php file.

    */
    Abyss.prototype.setupNotifications = function () {
        var _this = this;
        var num_players = Object.keys(this.gamedatas.players).length;
        var notifs = [
            ['explore', 1],
            ['takeAllyFromDiscard', 500],
            ['purchase', 500],
            ['exploreTake', 1000],
            ['setThreat', 1],
            ['lootReward', 1],
            ['monsterReward', 1],
            ['monsterTokens', 1],
            ['monsterHand', 1],
            ['discardCouncil', 1],
            ['requestSupport', 1],
            ['requestSupportCards', 1],
            ['recruit', 1],
            ['refillLords', 1],
            ['affiliate', 1],
            ['plot', 1],
            ['allyDeckShuffle', 1],
            ['diff', 1],
            ['disable', 1],
            ['moveLordsRight', 1],
            ['newLocations', 1],
            ['control', 1],
            ['loseLocation', 1],
            ['score', 1],
            ['useLord', 1],
            ['refreshLords', 1],
            ['finalRound', 1],
            ['payMartialLaw', 1],
            ['newLoot', 500],
            ['highlightLootsToDiscard', 1000],
            ['discardLoots', 1],
            ['searchSanctuaryAlly', 500],
            ['kraken', 500],
            ['placeSentinel', 500],
            ['placeKraken', 500],
            ['endGame_scoring', (5000 + (this.gamedatas.krakenExpansion ? 2000 : 0) + (this.gamedatas.leviathanExpansion ? 2000 : 0)) * num_players + 3000],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_".concat(notif[0]));
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Abyss.prototype.setScoringArrowRow = function (stage) {
        dojo.query('#game-scoring .arrow').style('visibility', 'hidden');
        dojo.query('.arrow', $('scoring-row-' + stage)).style('visibility', 'visible');
    };
    Abyss.prototype.setScoringRowText = function (stage, player_id, value) {
        $('scoring-row-' + stage + '-p' + player_id).innerHTML = value;
        if (stage === 'total') {
            this.scoreCtrl[player_id].toValue(value);
        }
    };
    Abyss.prototype.setScoringRowWinner = function (winner_ids, lines) {
        var _loop_7 = function (i) {
            var player_id = winner_ids[i];
            dojo.addClass($('scoring-row-name-p' + player_id), 'wavetext');
            lines.forEach(function (stage) {
                return dojo.style($('scoring-row-' + stage + '-p' + player_id), { 'backgroundColor': 'rgba(255, 215, 0, 0.3)' });
            });
        };
        for (var i in winner_ids) {
            _loop_7(i);
        }
    };
    Abyss.prototype.notif_finalRound = function (notif) {
        var playerId = notif.args.player_id;
        this.gamedatas.game_ending_player = playerId;
        dojo.style($('last-round'), { 'display': 'block' });
    };
    Abyss.prototype.notif_endGame_scoring = function (notif) {
        var _this = this;
        var breakdowns = notif.args.breakdowns;
        var winnerIds = notif.args.winner_ids;
        // Don't show the "final round" message if at the actual end
        dojo.style($('last-round'), { 'display': 'none' });
        dojo.style($('game-scoring'), { 'display': 'block' });
        var currentTime = 0;
        var lines = ['location', 'lord', 'affiliated', 'monster'];
        if (this.gamedatas.krakenExpansion) {
            lines.push('nebulis', 'kraken');
        }
        if (this.gamedatas.leviathanExpansion) {
            lines.push('wound', 'scourge');
        }
        lines.push('total');
        log(breakdowns);
        lines.forEach(function (stage) {
            var breakdownStage = stage + '_points';
            if (stage == 'total') {
                breakdownStage = 'score';
            }
            // Set arrow to here
            setTimeout(_this.setScoringArrowRow.bind(_this, stage), currentTime);
            for (var player_id in _this.gamedatas.players) {
                setTimeout(_this.setScoringRowText.bind(_this, stage, player_id, breakdowns[player_id][breakdownStage]), currentTime);
                currentTime += 1000;
            }
        });
        // Set winner to be animated!
        currentTime -= 500;
        setTimeout(this.setScoringRowWinner.bind(this, winnerIds, lines), currentTime);
    };
    Abyss.prototype.notif_useLord = function (notif) {
        var lordCard = this.lordManager.getCardElement({ lord_id: notif.args.lord_id });
        lordCard.dataset.used = '1';
        lordCard.classList.remove('unused');
    };
    Abyss.prototype.notif_refreshLords = function () {
        dojo.query(".lord").forEach(function (node) { return dojo.setAttr(node, "data-used", "0"); });
    };
    Abyss.prototype.notif_score = function (notif) {
        var score = notif.args.score;
        var player_id = notif.args.player_id;
        this.scoreCtrl[player_id].toValue(score);
    };
    Abyss.prototype.notif_control = function (notif) {
        var location = notif.args.location;
        var lords = notif.args.lords;
        var player_id = notif.args.player_id;
        // Add the location to the player board
        this.getPlayerTable(player_id).addLocation(location, lords, false);
        this.lordManager.updateLordKeys(player_id);
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_loseLocation = function (notif) {
        var location_id = notif.args.location_id;
        var player_id = notif.args.player_id;
        // Delete the location/lords
        this.getPlayerTable(player_id).removeLocation({ location_id: location_id });
        this.lordManager.updateLordKeys(player_id);
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_newLocations = function (notif) {
        var locations = notif.args.locations;
        var deck_size = notif.args.deck_size;
        this.visibleLocations.addCards(locations, {
            fromElement: document.querySelector('.location.location-back'),
            originalSide: 'back',
        });
        this.organiseLocations();
        this.setDeckSize(dojo.query('#locations-holder .location-back'), deck_size);
    };
    Abyss.prototype.notif_disable = function (notif) {
        var lord_id = notif.args.lord_id;
        this.lordManager.getCardElement({ lord_id: lord_id }).classList.add('disabled');
        for (var player_id in this.gamedatas.players) {
            this.lordManager.updateLordKeys(Number(player_id));
        }
    };
    Abyss.prototype.notif_allyDeckShuffle = function (notif) {
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        this.allyDiscardCounter.setValue(0);
    };
    Abyss.prototype.notif_lootReward = function (notif) {
        var playerId = notif.args.player_id;
        this.setPearlCount(playerId, notif.args.playerPearls);
        this.incMonsterCount(playerId, notif.args.monsters);
        this.keyTokenCounts[playerId] += notif.args.keys;
        this.updateKeyCounter(playerId);
    };
    Abyss.prototype.notif_monsterReward = function (notif) {
        this.notif_lootReward(notif);
        this.notif_setThreat({ args: { threat: 0 } });
    };
    Abyss.prototype.notif_monsterTokens = function (notif) {
        this.monsterTokens[this.getPlayerId()].addCards(notif.args.monsters);
    };
    Abyss.prototype.notif_monsterHand = function (notif) {
        var monsters = notif.args.monsters;
        var playerId = notif.args.player_id;
        this.monsterTokens[playerId].removeAll();
        this.monsterTokens[playerId].addCards(monsters);
    };
    Abyss.prototype.notif_plot = function (notif) {
        var lord = notif.args.lord;
        var player_id = notif.args.player_id;
        var deck_size = +notif.args.deck_size;
        var old_lord = notif.args.old_lord;
        this.setPearlCount(player_id, notif.args.playerPearls);
        if (old_lord) {
            this.visibleLords.removeCard(old_lord);
        }
        this.visibleLords.addCard(lord, {
            fromElement: document.querySelector('.lord.lord-back'),
            originalSide: 'back',
        });
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);
    };
    Abyss.prototype.notif_affiliate = function (notif) {
        var ally = notif.args.ally;
        var player_id = notif.args.player_id;
        this.getPlayerTable(player_id).addAffiliated(ally);
        if (notif.args.also_discard) {
            // Also discard this ally from my hand!
            this.incAllyCount(player_id, -1);
            // If it's me, also delete the actual ally
            if (player_id == this.getPlayerId()) {
                this.getCurrentPlayerTable().removeAllies([ally]);
            }
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_explore = function (notif) {
        var ally = notif.args.ally;
        this.visibleAllies.addCard(ally, {
            fromElement: document.getElementById('explore-track-deck'),
            originalSide: 'back',
        });
        // Update ally decksize
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        this.lastExploreTime = new Date().getTime();
    };
    Abyss.prototype.notif_exploreTake = function (notif) {
        var _this = this;
        // If this comes right after notif_explore, we want to delay by about 1-2 seconds
        var deltaTime = this.lastExploreTime ? (new Date().getTime() - this.lastExploreTime) : 1000;
        if (deltaTime < 2000) {
            setTimeout(function () {
                return _this.notif_exploreTake_real(notif);
            }, 2000 - deltaTime);
        }
        else {
            this.notif_exploreTake_real(notif);
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_exploreTake_real = function (notif) {
        var _this = this;
        var player_id = notif.args.player_id;
        var slot = notif.args.slot;
        // For each slot, animate to the council pile, fade out and destroy, then increase the council pile by 1
        var delay = 0;
        var cards = this.visibleAllies.getCards();
        var _loop_8 = function () {
            var ally = cards.find(function (ally) { return ally.place == i; });
            if (ally) {
                var faction = ally.faction;
                if (faction === null) {
                    // Monster just fades out
                    this_3.visibleAllies.removeCard(ally);
                    delay += 200;
                }
                else if (i != slot) {
                    if (faction != 10) {
                        // Animate to the council!
                        var deck_1 = dojo.query('#council-track .slot-' + faction);
                        this_3.councilStacks[faction].addCard(ally, null, { visible: false })
                            .then(function () { return _this.setDeckSize(deck_1, +dojo.attr(deck_1[0], 'data-size') + 1); });
                        delay += 200;
                    }
                }
                else {
                    // This is the card that was taken - animate it to hand or player board
                    var theAlly_1 = this_3.allyManager.getCardElement(ally);
                    if (player_id == this_3.getPlayerId()) {
                        setTimeout(function () {
                            _this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, theAlly_1);
                            _this.incAllyCount(player_id, 1);
                        }, delay);
                        delay += 200;
                    }
                    else {
                        dojo.setStyle(theAlly_1, "zIndex", "1");
                        dojo.setStyle(theAlly_1, "transition", "none");
                        animation = this_3.slideToObject(theAlly_1, $('player_board_' + player_id), 600, delay);
                        animation.onEnd = function () {
                            _this.visibleAllies.removeCard(ally);
                            _this.incAllyCount(player_id, 1);
                        };
                        animation.play();
                        delay += 200;
                    }
                }
            }
        };
        var this_3 = this, animation;
        for (var i = 1; i <= 5; i++) {
            _loop_8();
        }
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_takeAllyFromDiscard = function (notif) {
        var player_id = notif.args.player_id;
        if (player_id == this.getPlayerId()) {
            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, $('game-extra'));
        }
        this.incAllyCount(player_id, 1);
        this.allyDiscardCounter.setValue(notif.args.discardSize);
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_purchase = function (notif) {
        var _this = this;
        var player_id = notif.args.player_id;
        var ally = notif.args.ally;
        // Update handsize and pearls of purchasing player
        this.setPearlCount(player_id, notif.args.playerPearls);
        this.setPearlCount(notif.args.first_player_id, notif.args.firstPlayerPearls);
        if (this.gamedatas.krakenExpansion) {
            this.setNebulisCount(player_id, notif.args.playerNebulis);
            this.setNebulisCount(notif.args.first_player_id, notif.args.firstPlayerNebulis);
        }
        if (player_id == this.getPlayerId()) {
            this.getPlayerTable(Number(player_id)).addHandAlly(ally);
            this.incAllyCount(player_id, 1);
        }
        else {
            var theAlly = this.allyManager.getCardElement(ally);
            dojo.setStyle(theAlly, "zIndex", "1");
            dojo.setStyle(theAlly, "transition", "none");
            var animation = this.slideToObject(theAlly, $('player_board_' + player_id), 600);
            animation.onEnd = function () {
                _this.visibleAllies.removeCard(ally);
                _this.incAllyCount(player_id, 1);
            };
            animation.play();
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_setThreat = function (notif) {
        // Update handsize and pearls of purchasing player
        var tt = $('threat-token');
        dojo.removeClass(tt, 'slot-0 slot-1 slot-2 slot-3 slot-4 slot-5');
        dojo.addClass(tt, 'slot-' + notif.args.threat);
    };
    Abyss.prototype.notif_discardCouncil = function (notif) {
        var faction = notif.args.faction;
        // Empty the council pile
        var deck = dojo.query('#council-track .slot-' + faction);
        this.setDeckSize(deck, 0);
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
    };
    Abyss.prototype.notif_requestSupport = function (notif) {
        var _this = this;
        var player_id = notif.args.player_id;
        var faction = notif.args.faction;
        var num = notif.args.num;
        var deck = dojo.query('#council-track .slot-' + faction);
        this.setDeckSize(deck, 0);
        // Add cards to the player's hand
        if (player_id != this.getPlayerId()) {
            for (var i = 0; i < num; i++) {
                var anim = this.slideTemporaryObject(this.allyManager.renderBack(), 'council-track', 'council-track-' + faction, $('player_board_' + player_id), 600, i * 200);
                dojo.connect(anim, 'onEnd', function () {
                    _this.incAllyCount(player_id, 1);
                });
            }
        }
        else {
            this.incAllyCount(player_id, num);
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_requestSupportCards = function (notif) {
        var _this = this;
        var player_id = notif.args.player_id;
        var faction = notif.args.faction;
        var allies = notif.args.allies;
        // Add cards to the player's hand
        var delay = 0;
        var ROTATIONS = [-25, -10, 0, 13, 28];
        allies.forEach(function (ally) {
            setTimeout(function () {
                return _this.getPlayerTable(Number(player_id)).addHandAlly(ally, document.getElementById('council-track-' + faction), 'back', ROTATIONS[faction]);
            }, delay);
            delay += 250;
        });
    };
    Abyss.prototype.notif_moveLordsRight = function (notif) {
        this.visibleLords.addCards(notif.args.lords);
    };
    Abyss.prototype.notif_recruit = function (notif) {
        var lord = notif.args.lord;
        var player_id = +notif.args.player_id;
        var spent_lords = notif.args.spent_lords;
        var spent_allies = notif.args.spent_allies;
        // Spend pearls and allies
        if (spent_allies) {
            this.incAllyCount(player_id, -spent_allies.length);
        }
        if (notif.args.playerPearls !== undefined && notif.args.playerPearls !== null) {
            this.setPearlCount(player_id, notif.args.playerPearls);
        }
        if (notif.args.playerNebulis !== undefined && notif.args.playerNebulis !== null) {
            this.setNebulisCount(player_id, notif.args.playerNebulis);
        }
        // If it's me, then actually get rid of the allies
        if (spent_allies && player_id == this.getPlayerId()) {
            this.getCurrentPlayerTable().removeAllies(spent_allies);
        }
        if (spent_lords === null || spent_lords === void 0 ? void 0 : spent_lords.length) {
            this.getPlayerTable(player_id).removeLords(spent_lords);
            this.incLordCount(player_id, -spent_lords.length);
        }
        // Add the lord
        if (lord) {
            this.getPlayerTable(player_id).addLord(lord);
            if (!notif.args.freeLord) {
                this.incLordCount(player_id, 1);
            }
        }
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
        this.lordManager.updateLordKeys(player_id);
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_refillLords = function (notif) {
        var lords = notif.args.lords;
        var deck_size = notif.args.deck_size;
        this.visibleLords.addCards(lords, {
            fromElement: document.querySelector('.lord.lord-back'),
            originalSide: 'back',
        });
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);
    };
    Abyss.prototype.notif_diff = function (notif) {
        var _this = this;
        var player_id = +notif.args.player_id;
        var source = notif.args.source;
        var source_player_id = null;
        if (source.startsWith("player_")) {
            source_player_id = +source.slice("player_".length);
        }
        // TODO : Animate based on 'source'
        // If source starts "lord_" animate to the lord
        if (notif.args.playerPearls !== undefined && notif.args.playerPearls !== null) {
            this.setPearlCount(player_id, notif.args.playerPearls);
        }
        if (notif.args.playerNebulis !== undefined && notif.args.playerNebulis !== null) {
            this.setNebulisCount(player_id, notif.args.playerNebulis);
        }
        if (notif.args.keys) {
            this.keyTokenCounts[player_id] += notif.args.keys;
            this.updateKeyCounter(player_id);
        }
        if (notif.args.allies_lost) {
            var allies = notif.args.allies_lost;
            this.incAllyCount(player_id, -allies.length);
            // If it's me, also delete the actual ally
            this.getPlayerTable(notif.args.player_id).removeAllies(allies);
        }
        if (notif.args.monster) {
            this.incMonsterCount(player_id, notif.args.monster.length);
            var currentPlayerId = this.getPlayerId();
            if (source_player_id) {
                this.incMonsterCount(source_player_id, -notif.args.monster.length);
                if (source_player_id == currentPlayerId) {
                    // Remove it from me
                    this.monsterTokens[currentPlayerId].removeCards(notif.args.monster);
                }
            }
            if (player_id == currentPlayerId) {
                // Add it to me
                this.monsterTokens[currentPlayerId].addCards(notif.args.monster);
                notif.args.monster.forEach(function (monster) { return _this.monsterManager.setCardVisible(monster, true); });
            }
        }
        if (notif.args.monster_count) {
            this.incMonsterCount(player_id, notif.args.monster_count);
            if (source_player_id) {
                this.incMonsterCount(source_player_id, -notif.args.monster_count);
            }
        }
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_payMartialLaw = function (notif) {
        this.setPearlCount(notif.args.playerId, notif.args.playerPearls);
    };
    Abyss.prototype.notif_newLoot = function (notif) {
        this.locationManager.addLoot(notif.args.locationId, notif.args.newLoot);
    };
    Abyss.prototype.notif_highlightLootsToDiscard = function (notif) {
        this.locationManager.highlightLootsToDiscard(notif.args.locationId, notif.args.loots);
    };
    Abyss.prototype.notif_discardLoots = function (notif) {
        this.locationManager.discardLoots(notif.args.locationId, notif.args.loots);
    };
    Abyss.prototype.notif_searchSanctuaryAlly = function (notif) {
        var playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addHandAlly(notif.args.ally, document.getElementById('explore-track-deck'));
        this.incAllyCount(playerId, 1);
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
    };
    Abyss.prototype.notif_kraken = function (notif) {
        this.placeFigurineToken(notif.args.playerId, 'kraken');
    };
    Abyss.prototype.notif_scourge = function (notif) {
        this.placeFigurineToken(notif.args.playerId, 'scourge');
    };
    Abyss.prototype.notif_placeSentinel = function (notif) {
        this.placeSentinelToken(notif.args.playerId, notif.args.lordId, notif.args.location, notif.args.locationArg);
    };
    Abyss.prototype.notif_placeKraken = function (notif) {
        this.councilStacks[notif.args.faction].addCard(notif.args.ally);
        var deck = dojo.query('#council-track .slot-' + notif.args.faction);
        this.setDeckSize(deck, notif.args.deckSize);
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    Abyss.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                // Representation of the color of a card
                ['die1', 'die2'].forEach(function (property) {
                    if (args[property] && typeof args[property] === 'number') {
                        args[property] = "<div class=\"log-die\" data-value=\"".concat(args[property], "\"></div>");
                    }
                });
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
    };
    return Abyss;
}());
define([
    "dojo", "dojo/_base/declare", "dojo/debounce",
    "dojo/_base/fx", "dojo/fx",
    "dojo/NodeList-traverse",
    "ebg/core/gamegui",
    "ebg/counter",
], function (dojo, declare, pDebounce) {
    debounce = pDebounce;
    return declare("bgagame.abyss", ebg.core.gamegui, new Abyss());
});
