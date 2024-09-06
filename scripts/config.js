Hooks.once("init", async function () {
  libWrapper.register(
    "hover-distance",
    "Token.prototype.draw",
    DistanceTooltip.tokenDraw,
    "WRAPPER"
  );
  Token.prototype.drawDistanceTooltip = DistanceTooltip.draw;
  Token.prototype.clearDistanceTooltip = DistanceTooltip.clear;

  game.settings.register("hover-distance", "enableDistTooltip", {
    name: "Enable Hover Distance",
    hint: "If enabled, when overing over a token, show text indicating the distance to that token",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("hover-distance", "highlightGrid", {
    name: "Highlight Token",
    hint: "Highlight the token when overing over it",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register("hover-distance", "onlyInCombat", {
    name: "Highlight Only in Combat",
    hint: "Highlight only when a combat is started",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("hover-distance", "roundMeasurement", {
    name: "Round Measurements",
    hint: "Round measurements to the closest multiple of this number. 0 to cut decimals",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
  });

    game.settings.register("hover-distance", "rangeBands", {
        name: "Range Bands",
        hint: "Define range bands to use instead of the measurement. eg: 0,Short Range,60,Medium Range,120,Long Range",
        scope: "world",
        config: true,
        type: String,
        default: "",
    });
  
    game.settings.register("hover-distance", "rangeBandsNumbers", {
        name: "Show Measurement in Range Bands",
        hint: "When using range bands, show the measurement in addition to the range band name",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });
});

Hooks.once("ready", async function () {});
