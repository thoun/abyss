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
        var id = this.getId(card);
        var div = document.getElementById(id);
        if (!div) {
            return;
        }
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
                _this.game.connectTooltip(div, _this.renderTooltip(ally), "ally");
            },
            setupFrontDiv: function (ally, div) {
                div.dataset.faction = "".concat(ally.faction);
                div.dataset.value = "".concat(ally.value);
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
                _this.game.connectTooltip(div, _this.renderTooltip(lord), "lord");
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
        var playerId = this.game.getPlayerId();
        // Only show true costs for lords in the row
        // I have the Treasurer (25) : cost - 2
        if (dojo.query('#player-panel-' + playerId + ' .free-lords .lord-25:not(.disabled)').length > 0) {
            trueCost -= 2;
        }
        // I don't have the protector (14) ...
        if (dojo.query('#player-panel-' + playerId + ' .free-lords .lord-14:not(.disabled)').length == 0) {
            // Another player has the Recruiter (1) : cost + 2
            if (dojo.query('.player-panel:not(#player-panel-' + playerId + ') .free-lords .lord-1:not(.disabled)').length > 0) {
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
    LordManager.prototype.updateLordKeys = function (playerId) {
        var playerPanel = $('player-panel-' + playerId);
        var lords = dojo.query('.free-lords .lord', playerPanel);
        var keys = 0;
        var numLords = dojo.query('.lord', playerPanel).length;
        for (var i = 0; i < lords.length; i++) {
            var lord = lords[i];
            if (!dojo.hasClass(lord, "disabled")) {
                var keysStr = lord.getAttribute("data-keys");
                keys += isNaN(keysStr) ? 0 : Number(keysStr);
            }
        }
        $('lordkeycount_p' + playerId).innerHTML = keys;
        $('lordcount_p' + playerId).innerHTML = numLords;
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
                div.classList.add("location", "location-".concat(location.location_id), "board");
                div.dataset.locationId = "".concat(location.location_id);
            },
            setupFrontDiv: function (location, div) {
                var _a;
                var desc = _this.makeDesc(location, true);
                div.classList.add("location-".concat(location.location_id));
                div.innerHTML = "\n        <div class=\"location-clicker\"></div>\n        <span class=\"location-name\">".concat(_(location.name), "</span>\n        <span class=\"location-desc\">").concat(desc, "</span>\n        <div class=\"\"></div>\n        ");
                _this.game.connectTooltip(div, _this.renderTooltip(location), "location");
                if ([103, 104, 105, 106].includes(location.location_id)) {
                    div.insertAdjacentHTML('beforeend', "<div id=\"loot-stock-".concat(location.location_id, "\" class=\"loot-stock\"></div>"));
                    _this.lootStocks[location.location_id] = new CompressedLineStock(lootManager, document.getElementById("loot-stock-".concat(location.location_id)));
                    if ((_a = location.loots) === null || _a === void 0 ? void 0 : _a.length) {
                        _this.lootStocks[location.location_id].addCards(location.loots);
                    }
                }
            },
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
            farmer: '<span style="background-color: rgba(0,0,0,0.7); color: #999900">' + _('Farmer') + '</span>',
            soldier: '<span style="background-color: rgba(0,0,0,0.7); color: red">' + _('Soldier') + '</span>',
            merchant: '<span style="background-color: rgba(0,0,0,0.7); color: green">' + _('Merchant') + '</span>',
            politician: '<span style="background-color: rgba(255,255,255,0.7); color: blue">' + _('Politician') + '</span>',
            mage: '<span style="background-color: rgba(255,255,255,0.7); color: purple">' + _('Mage') + '</span>',
            seahorse: '<span style="background-color: rgba(0,0,0,0.7); color: #999900">' + _('Seahorse') + '</span>',
            crab: '<span style="background-color: rgba(0,0,0,0.7); color: red">' + _('Crab') + '</span>',
            shellfish: '<span style="background-color: rgba(0,0,0,0.7); color: green">' + _('Shellfish') + '</span>',
            squid: '<span style="background-color: rgba(255,255,255,0.7); color: blue">' + _('Squid') + '</span>',
            jellyfish: '<span style="background-color: rgba(255,255,255,0.7); color: purple">' + _('Jellyfish') + '</span>',
        };
        // TODO : Wrap points in nobr to avoid line breaks
        var desc = dojo.replace(_(location.desc), TEXT_HIGHLIGHT);
        if (laurel) {
            desc = desc.replace(/(\d+)\$/g, function (_, points) {
                return "<i class=\"icon icon-laurel\">".concat(points, "</i>");
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
        this.lootStocks[locationId].addCard(loot); // TODO add from an element ?
    };
    LocationManager.prototype.highlightLootsToDiscard = function (locationId, loots) {
        var _this = this;
        loots.forEach(function (loot) { var _a; return (_a = _this.lootManager.getCardElement(loot)) === null || _a === void 0 ? void 0 : _a.classList.add('selected'); });
    };
    LocationManager.prototype.discardLoots = function (locationId, loots) {
        this.lootStocks[locationId].removeCards(loots);
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
                _this.game.connectTooltip(div, _this.renderTooltip(loot), "loot");
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
        player.locations.forEach(function (location) { return _this.addLocation(location, player.lords.filter(function (lord) { return lord.location == location.location_id; })); });
        this.game.lordManager.updateLordKeys(this.playerId);
    }
    PlayerTable.prototype.addHandAlly = function (ally, fromElement, originalSide, rotationDelta) {
        this.hand.addCard(ally, {
            fromElement: fromElement,
            originalSide: originalSide,
            rotationDelta: rotationDelta,
        });
        this.game.organisePanelMessages();
    };
    PlayerTable.prototype.removeHandAllies = function (allies) {
        var _this = this;
        allies.forEach(function (ally) { return _this.game.allyManager.removeCard(ally); });
    };
    PlayerTable.prototype.organisePanelMessages = function () {
        var i = this.playerId;
        // Do they have any Lords?
        var lords = dojo.query('.lord', $('player-panel-' + i));
        $('no-lords-msg-p' + i).style.display = lords.length > 0 ? 'none' : 'block';
        // Affiliated?
        var affiliated = this.getAffiliatedAllies();
        $('no-affiliated-msg-p' + i).style.display = affiliated.length > 0 ? 'none' : 'block';
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
    PlayerTable.prototype.addLocation = function (location, lords) {
        this.locations.addCard(location);
        this.game.locationManager.addLords(location.location_id, lords);
    };
    PlayerTable.prototype.affiliatedAllyClick = function (ally) {
        if (this.game.gamedatas.gamestate.name === 'lord114multi') {
            this.game.discardAllies([ally.ally_id]);
        }
    };
    PlayerTable.sortAllies = sortFunction('faction', 'value');
    return PlayerTable;
}());
var isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
var log = isDebug ? console.log.bind(window.console) : function () { };
var debounce;
var Abyss = /** @class */ (function () {
    function Abyss() {
        this.playersTables = [];
        this.councilStacks = [];
    }
    Abyss.prototype.setup = function (gamedatas) {
        var _this = this;
        var _a;
        log("Starting game setup");
        if (!gamedatas.krakenExpansion) {
            this.dontPreloadImage("lords-kraken.jpg");
        }
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.allyManager = new AllyManager(this);
        this.lordManager = new LordManager(this);
        this.lootManager = new LootManager(this);
        this.locationManager = new LocationManager(this, this.lordManager, this.lootManager);
        // Use zoom when not on FF
        this.useZoom = false; //navigator.userAgent.toLowerCase().indexOf('firefox') <= -1;
        var self = this;
        dojo.connect($('modified-layout-checkbox'), 'onchange', function () {
            if ($('modified-layout-checkbox').checked) {
                dojo.addClass($('game-board-holder'), "playmat");
            }
            else {
                dojo.removeClass($('game-board-holder'), "playmat");
            }
        });
        var usePlaymat = this.prefs[100].value == 1;
        // On resize, fit cards to screen (debounced)
        if (usePlaymat) {
            dojo.addClass($('game-board-holder'), "playmat");
        }
        dojo.connect(window, "onresize", debounce(function () {
            var r = $('game-holder').getBoundingClientRect();
            var w = r.width;
            var zoom = 1;
            if (usePlaymat) {
                if (w > 1000) {
                    zoom = w / 1340;
                    dojo.addClass($('game-board-holder'), "playmat");
                    dojo.removeClass($('game-board-holder'), "playmat-narrow");
                }
                else {
                    dojo.removeClass($('game-board-holder'), "playmat");
                    dojo.addClass($('game-board-holder'), "playmat-narrow");
                }
            }
            self.zoomLevel = zoom;
            if (self.useZoom) {
                dojo.style($('game-board-holder'), {
                    zoom: zoom
                });
                dojo.style($('locations-holder-overflow'), {
                    zoom: zoom * 0.87
                });
            }
            else {
                var height = zoom == 1 ? "" : ((639 * zoom) + "px");
                dojo.style($('game-board-holder'), {
                    transform: "scale(" + zoom + ")",
                    height: height
                });
            }
            _this.organiseLocations();
        }, 200));
        if (gamedatas.krakenExpansion) {
            document.getElementById('scoring-row-total').insertAdjacentHTML('beforebegin', "\n                <tr id=\"scoring-row-nebulis\">\n                    <td class=\"first-column\"><span class=\"arrow\">\u2192</span><i id=\"scoring-nebulis-icon\" class=\"icon icon-nebulis\"></i></td>\n                </tr>\n                <tr id=\"scoring-row-kraken\">\n                    <td class=\"first-column\"><span class=\"arrow\">\u2192</span><i id=\"scoring-kraken-icon\" class=\"icon-kraken\"></i></td>\n                </tr>\n            ");
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
            var player_1 = gamedatas.players[p];
            var table = new PlayerTable(this, player_1);
            this.playersTables.push(table);
            p = gamedatas.turn_order[p];
        } while (p != this.player_id);
        // Monsters
        for (var playerId in gamedatas.players) {
            var monster_hand = $('monster-hand_p' + playerId);
            if (monster_hand) {
                var player = gamedatas.players[playerId];
                if (player.monsters && Object.keys(player.monsters).length > 0) {
                    dojo.style(monster_hand, "display", "block");
                    for (var i in player.monsters) {
                        dojo.place('<i class="icon icon-monster-faceup icon-monster-' + player.monsters[i].value + '">' + player.monsters[i].value + '</i>', monster_hand);
                    }
                }
            }
        }
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
        this.addEventToClass('icon-monster', 'onclick', 'onClickMonsterIcon');
        // Tooltips
        // Hide this one, because it doesn't line up due to Zoom
        //(this as any).addTooltip( 'explore-track-deck', '', _('Explore'), 1 );
        this.addTooltipToClass('pearl-holder', _('Pearls'), '');
        this.addTooltipToClass('nebulis-holder', _('Nebulis'), '');
        this.addTooltipToClass('key-holder', _('Key tokens (+ Keys from free Lords)'), '');
        this.addTooltipToClass('ally-holder', _('Ally cards in hand'), '');
        this.addTooltipToClass('monster-holder', _('Monster tokens'), '');
        this.addTooltipToClass('lordcount-holder', _('Number of Lords'), '');
        this.addTooltip('scoring-location-icon', _('Locations'), '');
        this.addTooltip('scoring-lords-icon', _('Lords'), '');
        this.addTooltip('scoring-affiliated-icon', _('Affiliated Allies'), '');
        this.addTooltip('scoring-monster-tokens-icon', _('Monster tokens'), '');
        if (gamedatas.krakenExpansion) {
            this.addTooltip('scoring-nebulis-icon', _('Nebulis'), '');
            this.addTooltip('scoring-kraken-icon', _('Kraken'), '');
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
                        self.onUpdateAutopass();
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
                    self.onUpdateAutopass();
                });
            };
            for (var i_3 = 0; i_3 <= 5; i_3++) {
                _loop_3(i_3);
            }
        }
        this.organisePanelMessages();
        // Setup game notifications to handle (see "setupNotifications" method below)
        this.setupNotifications();
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    Abyss.prototype.onEnteringState = function (stateName, args) {
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
                    var affordableLords = args.args._private.affordableLords;
                    for (var i in affordableLords) {
                        var lordId = affordableLords[i].lord_id;
                        dojo.query('#lords-track .lord.lord-' + lordId).addClass('card-current-move');
                    }
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
            case 'lord116':
                this.onEnteringLord116(args.args);
                break;
        }
    };
    Abyss.prototype.onEnteringRecruitPay = function (args) {
        // highlight the given lord
        dojo.query("#lords-track .lord[data-lord-id=" + args.lord_id + "]").addClass("selected");
    };
    Abyss.prototype.onEnteringLord7 = function () {
        // Put a red border around the player monster tokens (who aren't me)
        if (this.isCurrentPlayerActive()) {
            for (var player_id in this.gamedatas.players) {
                if (player_id != this.player_id) {
                    dojo.query("#cp_board_p" + player_id + " .icon.icon-monster").addClass("clickable");
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
            stock.onCardClick = function (ally) { return _this.takeAllyFromDiscard(ally.ally_id); };
        }
    };
    Abyss.prototype.onEnteringLord116 = function (args) {
        // Put a green border around selectable lords
        if (this.isCurrentPlayerActive()) {
            console.log(args.lords);
            args.lords.forEach(function (lord) {
                return dojo.query(".lord[data-lord-id=\"".concat(lord.lord_id, "\"]")).addClass('selectable');
            }
            //this.lordManager.getCardElement(lord).classList.add('selectable')
            );
        }
    };
    Abyss.prototype.onEnteringControlPostDraw = function (args) {
        // Fade out the locations you can't buy
        if (this.isCurrentPlayerActive()) {
            dojo.query("#locations-holder .location:not(.location-back)").addClass("unavailable");
            dojo.query("#locations-holder-overflow .location:not(.location-back)").addClass("unavailable");
            for (var iLocationId in args.location_ids) {
                var location_id = args.location_ids[iLocationId];
                dojo.query("#locations-holder .location.location-" + location_id).removeClass("unavailable");
                dojo.query("#locations-holder-overflow .location.location-" + location_id).removeClass("unavailable");
            }
        }
    };
    Abyss.prototype.onEnteringControl = function (args) {
        dojo.query(".free-lords .lord").removeClass("selected");
        for (var iLordId in args.default_lord_ids) {
            var lord_id = args.default_lord_ids[iLordId];
            dojo.query("#player-panel-" + this.player_id + " .free-lords .lord.lord-" + lord_id).addClass("selected");
        }
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
                dojo.query(".cp_board .icon.icon-monster").removeClass("clickable");
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
                    var recruitArgs_1 = args;
                    this.addActionButton('button_recruit', _('Recruit'), function () { return _this.onRecruit(0); });
                    var recruitButton = document.getElementById('button_recruit');
                    recruitButton.innerHTML = _('Recruit') + ' (' + recruitArgs_1.cost + ' <i class="icon icon-pearl"></i>)';
                    recruitButton.classList.toggle('disabled', recruitArgs_1.cost > recruitArgs_1.pearls);
                    recruitButton.dataset.baseCost = '' + recruitArgs_1.cost;
                    recruitButton.dataset.pearls = '' + recruitArgs_1.pearls;
                    recruitButton.dataset.nebulis = '' + recruitArgs_1.nebulis;
                    if (recruitArgs_1.withNebulis) {
                        Object.keys(recruitArgs_1.withNebulis).forEach(function (i) {
                            _this.addActionButton("button_recruit_with".concat(i, "Nebulis"), _('Recruit') + " (".concat(args.cost - Number(i) > 0 ? "".concat(args.cost - Number(i), " <i class=\"icon icon-pearl\"></i> ") : '').concat(i, " <i class=\"icon icon-nebulis\"></i>)"), function () { return _this.onRecruit(Number(i)); });
                            var button = document.getElementById("button_recruit_with".concat(i, "Nebulis"));
                            button.classList.toggle('disabled', recruitArgs_1.nebulis < Number(i) || (recruitArgs_1.cost - Number(i)) > recruitArgs_1.pearls);
                        });
                    }
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
                    // Put a red border around the player monster tokens (who aren't me)
                    for (var player_id in this.gamedatas.players) {
                        if (player_id != this.player_id) {
                            var num_tokens = +$('monstercount_p' + player_id).innerHTML;
                            if (num_tokens > 0) {
                                this.addActionButton('button_steal_monster_token_' + player_id, this.gamedatas.players[player_id].name, 'onClickMonsterIcon');
                            }
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
                    var _loop_5 = function (i_5) {
                        this_1.addActionButton("selectAllyRace".concat(i_5), this_1.allyManager.allyNameText(i_5), function () { return _this.selectAllyRace(i_5); });
                        document.getElementById("selectAllyRace".concat(i_5)).classList.add('affiliate-button');
                    };
                    var this_1 = this;
                    for (var i_5 = 0; i_5 < 5; i_5++) {
                        _loop_5(i_5);
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
    Abyss.prototype.connectTooltip = function (node, html, offsetType) {
        var _this = this;
        var tt = $('abs-tooltip-0');
        dojo.connect(node, "onmouseenter", function () {
            if (_this.prefs[200].value == 1) {
                return;
            }
            var r = node.getBoundingClientRect();
            var outer = $('game-holder').getBoundingClientRect();
            var left = r.left - outer.left;
            var top = r.top - outer.top;
            var zoomSupported = _this.useZoom;
            // Always include content zoom
            var contentZoom = zoomSupported ? (+dojo.style($('page-content'), 'zoom') || 1) : 1;
            var totalZoom = contentZoom;
            // Only include game zoom if the node is in the zoomed element
            var gameZoom = 1;
            if (zoomSupported && dojo.hasClass($('game-board-holder'), "playmat") && $('game-board-holder').contains(node)) {
                gameZoom = _this.zoomLevel;
            }
            if (dojo.hasClass($('game-board-holder'), "playmat") && $('locations-holder-holder').contains(node)) {
                gameZoom *= zoomSupported ? (dojo.style($('locations-holder-holder'), 'zoom') || 1) : 1;
            }
            totalZoom *= gameZoom;
            top *= totalZoom;
            left *= totalZoom;
            if (typeof html === 'function') {
                tt.innerHTML = html.call(_this);
            }
            else {
                tt.innerHTML = html;
            }
            // If there is room above, put it there...
            var offsetX = 0;
            var offsetY = 0;
            if (offsetType === "lord") {
                offsetX = 44 * gameZoom;
                offsetY = 68 * gameZoom;
            }
            else if (offsetType === "ally") {
                offsetX = 29 * gameZoom;
                offsetY = 43 * gameZoom;
            }
            var padding = 20;
            var positions = ["right", "top", "bottom", "left"];
            var originalTop = top;
            var originalLeft = left;
            for (var i in positions) {
                top = originalTop;
                left = originalLeft;
                var position = positions[i];
                if (position == "right") {
                    left += node.offsetWidth * totalZoom + padding;
                    left += offsetX;
                    top -= offsetY;
                }
                else if (position == "top") {
                    top -= tt.offsetHeight * contentZoom + padding;
                    left -= offsetX;
                    top -= offsetY;
                }
                else if (position == "bottom") {
                    top += node.offsetHeight * totalZoom + padding;
                    left -= offsetX;
                    top += offsetY;
                }
                else if (position == "left") {
                    left -= tt.offsetWidth * contentZoom + padding;
                    left -= offsetX;
                    top -= offsetY;
                }
                // If it fits, stop here
                var right = left + tt.offsetWidth * contentZoom;
                var bottom = top + tt.offsetHeight * contentZoom;
                if (right > $('page-content').offsetWidth) {
                    continue;
                }
                if (left < 0) {
                    continue;
                }
                var scrollLimit = window.scrollY - $('page-content').offsetTop;
                if (top < scrollLimit) {
                    continue;
                }
                break;
            }
            dojo.style(tt, { 'opacity': '1', 'top': top + 'px', 'left': left + 'px' });
        });
        dojo.connect(node, "onmouseleave", function () { return dojo.style(tt, { 'opacity': '0' }); });
    };
    Abyss.prototype.getPlayerId = function () {
        return Number(this.player_id);
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
            var playerId = Number(player.id);
            // Setting up players boards if needed
            var player_board_div = $('player_board_' + playerId);
            var html = "\n            <div id=\"cp_board_p".concat(player.id, "\" class=\"cp_board\" data-player-id=\"").concat(player.id, "\">\n                <span class=\"pearl-holder spacer\" id=\"pearl-holder_p").concat(player.id, "\"><i class=\"icon icon-pearl\"></i><span class=\"spacer\" id=\"pearlcount_p").concat(player.id, "\">").concat(player.pearls, "</span></span>");
            if (gamedatas.krakenExpansion) {
                html += "<span class=\"nebulis-holder spacer\" id=\"nebulis-holder_p".concat(player.id, "\"><i class=\"icon icon-nebulis\"></i><span class=\"spacer\" id=\"nebuliscount_p").concat(player.id, "\">").concat(player.nebulis, "</span></span>");
            }
            html += "    <span class=\"key-holder spacer\" id=\"key-holder_p".concat(player.id, "\"><i class=\"icon icon-key\"></i><span class=\"spacer\" id=\"keycount_p").concat(player.id, "\">").concat(player.keys, "</span><span class=\"key-addendum\">(+<span id=\"lordkeycount_p").concat(player.id, "\"></span>)</span></span>\n                <span class=\"ally-holder spacer\" id=\"ally-holder_p").concat(player.id, "\"><i class=\"icon icon-ally\"></i><span class=\"spacer\" id=\"allycount_p").concat(player.id, "\">").concat(player.hand_size, "</span></span>\n                <span class=\"monster-holder spacer\" id=\"monster-holder_p").concat(player.id, "\"><i class=\"icon icon-monster\"></i><span class=\"spacer\" id=\"monstercount_p").concat(player.id, "\">").concat(player.num_monsters, "</span></span>\n                <span class=\"lordcount-holder spacer\"><i class=\"icon icon-lord\"></i><span id=\"lordcount_p").concat(player.id, "\">").concat(player.lords.length, "</span></span>\n                <div class=\"monster-hand\" id=\"monster-hand_p").concat(player.id, "\"></div>\n            </div>");
            dojo.place(html, player_board_div);
            // kraken token
            dojo.place("<div id=\"player_board_".concat(player.id, "_krakenWrapper\" class=\"krakenWrapper\"></div>"), "player_board_".concat(player.id));
            if (gamedatas.kraken == playerId) {
                _this.placeKrakenToken(playerId);
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
            $('scoring-row-total').innerHTML += "<td id=\"scoring-row-total-p".concat(playerId, "\"></td>");
        });
    };
    Abyss.prototype.incPearlCount = function (playerId, inc) {
        $('pearlcount_p' + playerId).innerHTML = +($('pearlcount_p' + playerId).innerHTML) + inc;
    };
    Abyss.prototype.incNebulisCount = function (playerId, inc) {
        $('nebuliscount_p' + playerId).innerHTML = +($('nebuliscount_p' + playerId).innerHTML) + inc;
    };
    Abyss.prototype.placeKrakenToken = function (playerId) {
        var krakenToken = document.getElementById('krakenToken');
        if (krakenToken) {
            if (playerId == 0) {
                this.fadeOutAndDestroy(krakenToken);
            }
            else {
                var parentElement = krakenToken.parentElement;
                document.getElementById("player_board_".concat(playerId, "_krakenWrapper")).appendChild(krakenToken);
                stockSlideAnimation({
                    element: krakenToken,
                    fromElement: parentElement
                });
            }
        }
        else {
            if (playerId != 0) {
                dojo.place('<div id="krakenToken" class="token"></div>', "player_board_".concat(playerId, "_krakenWrapper"));
                this.addTooltipHtml('krakenToken', _("The Kraken figure allows players to identify, during the game, the most corrupt player. The figure is given to the first player to receive any Nebulis. As soon as an opponent ties or gains more Nebulis than the most corrupt player, they get the Kraken figure"));
            }
        }
    };
    Abyss.prototype.getSentinelToken = function (lordId) {
        var div = document.getElementById("sentinel-".concat(lordId));
        if (!div) {
            div = document.createElement('div');
            div.id = "sentinel-".concat(lordId);
            div.classList.add('sentinel-token');
            div.dataset.lordId = "".concat(lordId);
        }
        return div;
    };
    Abyss.prototype.placeSentinelToken = function (playerId, lordId, location, locationArg) {
        var sentinel = this.getSentinelToken(lordId);
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
        var lord_ids = [];
        dojo.query("#player-panel-" + this.player_id + " .free-lords .lord.selected").forEach(function (node) {
            return lord_ids.push(+dojo.attr(node, 'data-lord-id'));
        });
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
        if (!this.checkAction('exploreTake')) {
            return;
        }
        this.takeAction('exploreTake', {
            slot: ally.place,
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
    Abyss.prototype.onClickPlayerHand = function (ally) {
        if (this.checkAction('pay', true)) {
            this.allyManager.getCardElement(ally).classList.toggle('selected');
            var recruitButton = document.getElementById('button_recruit');
            var lord = dojo.query("#lords-track .lord.selected")[0];
            var baseCost = Number(recruitButton.dataset.baseCost);
            var pearls_1 = Number(recruitButton.dataset.pearls);
            var nebulis_1 = Number(recruitButton.dataset.nebulis);
            var diversity = +dojo.attr(lord, 'data-diversity');
            // Value selected
            var value_1 = 0;
            dojo.query("#player-hand .ally.selected").forEach(function (node) {
                value_1 += +dojo.attr(node, 'data-value');
            });
            var shortfall_1 = baseCost - value_1;
            if (shortfall_1 < 0) {
                shortfall_1 = 0;
            }
            // Update "Recruit" button
            recruitButton.innerHTML = _('Recruit') + ' (' + shortfall_1 + ' <i class="icon icon-pearl"></i>)';
            recruitButton.classList.toggle('disabled', shortfall_1 > pearls_1);
            [1, 2].forEach(function (i) {
                var button = document.getElementById("button_recruit_with".concat(i, "Nebulis"));
                if (button) {
                    var cost = shortfall_1;
                    button.innerHTML = _('Recruit') + " (".concat(cost - i > 0 ? "".concat(cost - i, " <i class=\"icon icon-pearl\"></i> ") : '').concat(i, " <i class=\"icon icon-nebulis\"></i>)");
                    button.classList.toggle('disabled', nebulis_1 < i || (cost - i) > pearls_1 || shortfall_1 < i);
                }
            });
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
    Abyss.prototype.onClickMonsterIcon = function (evt) {
        if (dojo.hasClass(evt.target, 'clickable')) {
            if (this.checkAction('chooseMonsterTokens', true)) {
                dojo.stopEvent(evt);
                // Discard this card...
                var player_id = dojo.attr(dojo.query(evt.target).closest('.cp_board')[0], 'data-player-id');
                this.takeAction('chooseMonsterTokens', {
                    player_id: player_id,
                });
            }
        }
        else {
            if (this.checkAction('chooseMonsterTokens')) {
                dojo.stopEvent(evt);
                // Discard this card...
                var player_id = +evt.target.id.replace("button_steal_monster_token_", "");
                this.takeAction('chooseMonsterTokens', {
                    player_id: player_id,
                });
            }
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
            ['endGame_scoring', 5000 * num_players + 3000],
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
    };
    Abyss.prototype.setScoringRowWinner = function (winner_ids, lines) {
        var _loop_6 = function (i) {
            var player_id = winner_ids[i];
            dojo.addClass($('scoring-row-name-p' + player_id), 'wavetext');
            lines.forEach(function (stage) {
                return dojo.style($('scoring-row-' + stage + '-p' + player_id), { 'backgroundColor': 'rgba(255, 215, 0, 0.3)' });
            });
        };
        for (var i in winner_ids) {
            _loop_6(i);
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
        lines.push('total');
        console.log(breakdowns);
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
        this.getPlayerTable(player_id).addLocation(location, lords);
        this.lordManager.updateLordKeys(player_id);
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_loseLocation = function (notif) {
        var location_id = notif.args.location_id;
        var player_id = notif.args.player_id;
        // Delete the location/lords
        dojo.query('.location.location-' + location_id).forEach(function (node) { return dojo.destroy(node); });
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
        dojo.query('.lord-' + lord_id).addClass('disabled');
        for (var player_id in this.gamedatas.players) {
            this.lordManager.updateLordKeys(player_id);
        }
    };
    Abyss.prototype.notif_allyDeckShuffle = function (notif) {
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
    };
    Abyss.prototype.notif_lootReward = function (notif) {
        var player_id = notif.args.player_id;
        this.incPearlCount(player_id, +notif.args.pearls);
        $('monstercount_p' + player_id).innerHTML = +($('monstercount_p' + player_id).innerHTML) + +notif.args.monsters;
        $('keycount_p' + player_id).innerHTML = +($('keycount_p' + player_id).innerHTML) + +notif.args.keys;
    };
    Abyss.prototype.notif_monsterReward = function (notif) {
        this.notif_lootReward(notif);
        this.notif_setThreat({ args: { threat: 0 } });
    };
    Abyss.prototype.notif_monsterTokens = function (notif) {
        var monsters = notif.args.monsters;
        var monster_hand = $('monster-hand_p' + this.player_id);
        if (monster_hand) {
            dojo.style(monster_hand, "display", "block");
            for (var i in monsters) {
                dojo.place('<i class="icon icon-monster-faceup icon-monster-' + monsters[i].value + '">' + monsters[i].value + '</i>', monster_hand);
            }
        }
    };
    Abyss.prototype.notif_monsterHand = function (notif) {
        var monsters = notif.args.monsters;
        var playerId = notif.args.player_id;
        var monster_hand = $('monster-hand_p' + playerId);
        if (monster_hand) {
            dojo.style(monster_hand, "display", "block");
            monster_hand.innerHTML = '';
            for (var i in monsters) {
                dojo.place('<i class="icon icon-monster-faceup icon-monster-' + monsters[i].value + '">' + monsters[i].value + '</i>', monster_hand);
            }
        }
    };
    Abyss.prototype.notif_plot = function (notif) {
        var lord = notif.args.lord;
        var player_id = notif.args.player_id;
        var deck_size = +notif.args.deck_size;
        var pearls = +notif.args.pearls;
        var old_lord = notif.args.old_lord;
        this.incPearlCount(player_id, -pearls);
        this.visibleLords.addCard(lord, {
            fromElement: document.querySelector('.lord.lord-back'),
            originalSide: 'back',
        });
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);
        if (old_lord) {
            dojo.query('.lord-' + old_lord.lord_id).forEach(function (node) { return dojo.destroy(node); });
        }
    };
    Abyss.prototype.notif_affiliate = function (notif) {
        var ally = notif.args.ally;
        var player_id = notif.args.player_id;
        this.getPlayerTable(player_id).addAffiliated(ally);
        if (notif.args.also_discard) {
            // Also discard this ally from my hand!
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) - 1;
            // If it's me, also delete the actual ally
            if (player_id == this.getPlayerId()) {
                this.getCurrentPlayerTable().removeHandAllies([ally]);
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
        // If this comes right after notif_explore, we want to delay by about 1-2 seconds
        var deltaTime = this.lastExploreTime ? (new Date().getTime() - this.lastExploreTime) : 1000;
        if (deltaTime < 2000) {
            var self_1 = this;
            setTimeout(function () {
                return self_1.notif_exploreTake_real(notif);
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
        var self = this;
        var cards = this.visibleAllies.getCards();
        var _loop_7 = function () {
            var ally = cards.find(function (ally) { return ally.place == i; });
            if (ally) {
                var faction = ally.faction;
                if (faction === null) {
                    // Monster just fades out
                    this_2.visibleAllies.removeCard(ally);
                    delay += 200;
                }
                else if (i != slot && faction != 10) {
                    // Animate to the council!
                    this_2.councilStacks[faction].addCard(ally);
                    delay += 200;
                }
                else {
                    // This is the card that was taken - animate it to hand or player board
                    var theAlly_1 = this_2.allyManager.getCardElement(ally);
                    if (player_id == this_2.getPlayerId()) {
                        setTimeout(function () {
                            _this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, theAlly_1);
                            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
                        }, delay);
                        delay += 200;
                    }
                    else {
                        dojo.setStyle(theAlly_1, "zIndex", "1");
                        dojo.setStyle(theAlly_1, "transition", "none");
                        animation = this_2.slideToObject(theAlly_1, $('player_board_' + player_id), 600, delay);
                        animation.onEnd = function () {
                            dojo.destroy(theAlly_1);
                            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
                        };
                        animation.play();
                        delay += 200;
                    }
                }
            }
        };
        var this_2 = this, animation;
        for (var i = 1; i <= 5; i++) {
            _loop_7();
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_takeAllyFromDiscard = function (notif) {
        var player_id = notif.args.player_id;
        if (player_id == this.getPlayerId()) {
            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, $('game-extra'));
        }
        $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_purchase = function (notif) {
        var player_id = notif.args.player_id;
        // Update handsize and pearls of purchasing player
        this.incPearlCount(player_id, -notif.args.incPearls);
        this.incPearlCount(notif.args.first_player_id, notif.args.incPearls);
        if (this.gamedatas.krakenExpansion) {
            this.incNebulisCount(player_id, -notif.args.incNebulis);
            this.incNebulisCount(notif.args.first_player_id, notif.args.incNebulis);
        }
        if (player_id == this.getPlayerId()) {
            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally);
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
        }
        else {
            var theAlly_2 = this.allyManager.getCardElement(notif.args.ally);
            dojo.setStyle(theAlly_2, "zIndex", "1");
            dojo.setStyle(theAlly_2, "transition", "none");
            var animation = this.slideToObject(theAlly_2, $('player_board_' + player_id), 600);
            animation.onEnd = function () {
                dojo.destroy(theAlly_2);
                $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
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
    };
    Abyss.prototype.notif_requestSupport = function (notif) {
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
                    $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + 1;
                });
            }
        }
        else {
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) + num;
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
                _this.getPlayerTable(Number(player_id)).addHandAlly(ally, document.getElementById('council-track-' + faction), 'back', ROTATIONS[faction]);
                _this.organisePanelMessages();
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
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) - spent_allies.length;
        }
        if (notif.args.incPearls) {
            this.incPearlCount(player_id, -notif.args.incPearls);
        }
        if (this.gamedatas.krakenExpansion && notif.args.incNebulis) {
            this.incNebulisCount(player_id, -notif.args.incNebulis);
        }
        // If it's me, then actually get rid of the allies
        if (spent_allies && player_id == this.getPlayerId()) {
            this.getCurrentPlayerTable().removeHandAllies(spent_allies);
        }
        if (spent_lords) {
            this.getPlayerTable(player_id).removeLords(spent_lords);
        }
        // Add the lord
        if (lord) {
            this.getPlayerTable(player_id).addLord(lord);
        }
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
        var player_id = +notif.args.player_id;
        var source = notif.args.source;
        var source_player_id = null;
        if (source.startsWith("player_")) {
            source_player_id = +source.slice("player_".length);
        }
        // TODO : Animate based on 'source'
        // If source starts "lord_" animate to the lord
        if (notif.args.pearls) {
            this.incPearlCount(player_id, notif.args.pearls);
        }
        if (notif.args.nebulis) {
            this.incNebulisCount(player_id, notif.args.nebulis);
        }
        if (notif.args.keys) {
            var keys = notif.args.keys;
            $('keycount_p' + player_id).innerHTML = +($('keycount_p' + player_id).innerHTML) + +keys;
        }
        if (notif.args.allies_lost) {
            var allies = notif.args.allies_lost;
            $('allycount_p' + player_id).innerHTML = +($('allycount_p' + player_id).innerHTML) - +allies.length;
            // If it's me, also delete the actual ally
            if (notif.args.player_id == this.getPlayerId()) {
                this.getCurrentPlayerTable().removeHandAllies(allies);
            }
        }
        if (notif.args.monster) {
            $('monstercount_p' + player_id).innerHTML = +($('monstercount_p' + player_id).innerHTML) + notif.args.monster.length;
            if (source_player_id) {
                $('monstercount_p' + source_player_id).innerHTML = +($('monstercount_p' + source_player_id).innerHTML) - notif.args.monster.length;
                if (source_player_id == this.player_id) {
                    // Remove it from me
                    var monster_hand = $('monster-hand_p' + this.player_id);
                    if (monster_hand) {
                        for (var i in notif.args.monster) {
                            var tokens = dojo.query(".icon-monster-" + notif.args.monster[i].value, monster_hand);
                            if (tokens.length > 0) {
                                dojo.destroy(tokens[0]);
                            }
                        }
                    }
                }
            }
            if (player_id == this.player_id) {
                // Add it to me
                var monster_hand = $('monster-hand_p' + this.player_id);
                if (monster_hand) {
                    dojo.style(monster_hand, "display", "block");
                    for (var i in notif.args.monster) {
                        dojo.place('<i class="icon icon-monster-faceup icon-monster-' + notif.args.monster[i].value + '">' + notif.args.monster[i].value + '</i>', monster_hand);
                    }
                }
            }
        }
        if (notif.args.monster_count) {
            $('monstercount_p' + player_id).innerHTML = +($('monstercount_p' + player_id).innerHTML) + +notif.args.monster_count;
            if (source_player_id) {
                $('monstercount_p' + source_player_id).innerHTML = +($('monstercount_p' + source_player_id).innerHTML) - +notif.args.monster_count;
            }
        }
        this.organisePanelMessages();
    };
    Abyss.prototype.notif_payMartialLaw = function (notif) {
        this.incPearlCount(notif.args.playerId, -notif.args.spentPearls);
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
        this.getPlayerTable(notif.args.playerId).addHandAlly(notif.args.ally, document.getElementById('explore-track-deck'));
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
    };
    Abyss.prototype.notif_kraken = function (notif) {
        this.placeKrakenToken(notif.args.playerId);
    };
    Abyss.prototype.notif_placeSentinel = function (notif) {
        this.placeSentinelToken(notif.args.playerId, notif.args.lordId, notif.args.location, notif.args.locationArg);
    };
    Abyss.prototype.notif_placeKraken = function (notif) {
        this.councilStacks[notif.args.faction].addCard(notif.args.ally);
        var deck = dojo.query('#council-track .slot-' + notif.args.faction);
        this.setDeckSize(deck, notif.args.deckSize);
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
