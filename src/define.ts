define([
    "dojo","dojo/_base/declare","dojo/debounce",
    "dojo/_base/fx", "dojo/fx",
    "dojo/NodeList-traverse",
    "ebg/core/gamegui",
    "ebg/counter",
    g_gamethemeurl + "modules/abs_helpers.js",
],
function (dojo, declare, pDebounce) {
    debounce = pDebounce;
    return declare("bgagame.abyss", ebg.core.gamegui, new Abyss());
});