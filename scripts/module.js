class DistanceTooltip {
  constructor(originToken, destinationToken) {
    this.destinationToken = destinationToken;
    const ray = new Ray(
      { x: originToken.center.x, y: originToken.center.y },
      { x: destinationToken.center.x, y: destinationToken.center.y }
    );
    this.distance = canvas.grid.measureDistances([{ ray }], {
      gridSpaces: true,
    });
  }

  static draw() {
    this.tooltip.visible=false
    if(!this.distanceTooltip.parent){
      this.addChild(this.distanceTooltip);
    }
    const origin = canvas?.tokens?.controlled[0];
    if (!origin || origin.id == this.id || this?.document?.disposition === CONST.TOKEN_DISPOSITIONS.SECRET) return;
    const ray = new Ray(
      { x: this.center.x, y: this.center.y },
      { x: origin.center.x, y: origin.center.y }
    );
    const distance = DistanceTooltip.measureMinTokenDistance(this,origin)
    this.distanceTooltip.removeChildren().forEach((c) => c.destroy());
    const band = DistanceTooltip.getRangeBand(distance)
    // Create the tooltip Text
    let tip;
    if (!band) {
      tip = `${distance} ${canvas?.scene?.grid?.units}.`;
    } else {
      const rangeBandsNumbers = game.settings.get("hover-distance", "rangeBandsNumbers");
      tip = rangeBandsNumbers ? `${band} (${distance} ${canvas?.scene?.grid?.units}).` : `${band}`;
    }
    if (!tip.length) return;
    const style = CONFIG.canvasTextStyle.clone();
    style.fontSize = Math.max(Math.round(canvas.dimensions.size * 0.36 * 12) / 12, 36);
    const text = new PreciseText(tip, style);
    this.distanceTooltip.addChild(text);

    // Add the tooltip at the top of the parent Token container
    text.anchor.set(0.5, 1);
    this.distanceTooltip.position.set(this.w / 2, -2);
    DistanceTooltip.highlightGrid(this)
  }

  static clear() {
    this.tooltip.visible=true
    this.distanceTooltip?.removeChildren()?.forEach((c) => c.destroy());
    DistanceTooltip.clearGrid();
  }
  static async tokenDraw(wrapped, ...args) {
    await wrapped(...args);
    this.distanceTooltip = this.addChild(new PIXI.Container());
    return this;
  }

  static highlightGrid(token) {
    if(!game.settings.get("hover-distance", "highlightGrid") || !token.isVisible) return;
    if (!canvas.grid.distanceHighlight) {
      canvas.grid.distanceHighlight = new PIXI.Graphics();
      canvas.grid.addChild(canvas.grid.distanceHighlight);
    }
    if(!canvas.grid.distanceHighlight.geometry){
      canvas.grid.removeChild(canvas.grid.distanceHighlight);
      canvas.grid.distanceHighlight = new PIXI.Graphics();
      canvas.grid.addChild(canvas.grid.distanceHighlight);
    }
    const highlight = canvas.grid.distanceHighlight;
    highlight.clear();
    const shape = new PIXI.Rectangle(token.x,token.y,token.w,token.h);
    const color = 0x0000ff;
    const border = 0x000000;
    const alpha = 0.25;
    highlight.beginFill(color, alpha);
    if (border) highlight.lineStyle(2, border, Math.min(alpha * 1.5, 1.0));
    highlight.drawShape(shape).endFill();
  }
  static clearGrid(){
    const highlight = canvas?.grid?.distanceHighlight;
    if(highlight && !highlight._destroyed) highlight?.clear();
  }

  static getDistEuclidean(p1, p2){
    const unitsToPixel = canvas.dimensions.size / canvas.dimensions.distance;
    const d =
    Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2)
    ) / unitsToPixel;
  return d;
  }

  static measureMinTokenDistance(token1, token2){
    const unitsToPixel = canvas.dimensions.size / canvas.dimensions.distance;
    const square = (canvas.scene.dimensions.size)
    const halfSquare = square/2;
    const generatePoints = (token) => {
        const tokenHeight = ((token.losHeight ?? (token.document.elevation+0.00001))-token.document.elevation)/canvas.scene.dimensions.distance;
        const tokenPositions = [];
        const tokenStart = {
          x: token.center.x,
          y: token.document.elevation*unitsToPixel,
          z: token.center.y
        }
        tokenStart.x += -token.document.width*halfSquare+halfSquare
        tokenStart.y += halfSquare
        tokenStart.z += -token.document.height*halfSquare+halfSquare

        for(let i = 0; i < token.document.width; i++){
            for(let j = 0; j < token.document.height; j++){
                for(let k = 0; k < tokenHeight; k++){
                    const position = {
                        x: tokenStart.x + i*square,
                        y: tokenStart.y + k*square,
                        z: tokenStart.z + j*square
                    };
                    tokenPositions.push(position);
                }
            }
        }
        return tokenPositions;
    }
    const measurements = [];
    const originPoints = generatePoints(token1);
    const targetPoints = generatePoints(token2);
    for(const oPoint of originPoints){
        for(const tPoint of targetPoints){
          const ray = new Ray(
            { x: oPoint.x, y: oPoint.z },
            { x: tPoint.x, y: tPoint.z }
          );
          const useEuclidean = Math.abs(oPoint.y - tPoint.y) > canvas.scene.dimensions.size/2;
          const distance = useEuclidean
            ? DistanceTooltip.getDistEuclidean(oPoint, tPoint)
            : 
                canvas.grid.measureDistances([{ ray }], {
                  gridSpaces: true,
                })
          measurements.push(distance);
        }
    }
    const rounding = game.settings.get("hover-distance", "roundMeasurement");
    if (!rounding) return Math.floor(Math.min(...measurements));
    let min = Math.min(...measurements);
    const roundingValue = rounding;
    const remainder = min % roundingValue;
    if(remainder > roundingValue/2) min += roundingValue - remainder;
    else min -= remainder;
    min = Math.round(min * 1000000) / 1000000;
    return min;
    
  }

  static getRangeBand(distance) { 
    const rangeBands = game.settings.get("hover-distance", "rangeBands");
    if(!rangeBands) return;
    const bands = rangeBands.split(",");
    const processedBands = []
    for (let i = 0; i < bands.length; i+=2) {
      const bandDist = parseFloat(bands[i]);
      const bandName = bands[i + 1];
      processedBands.push({dist: bandDist, name: bandName});
    }
    for (let i = 0; i < processedBands.length; i++) {
      const band = processedBands[i];
      const nextBand = processedBands[i + 1];
      if (!nextBand) return band.name;
      if(distance >= band.dist && distance < nextBand.dist ) return band.name;
    }

  }

}
