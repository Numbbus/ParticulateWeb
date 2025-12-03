import { Graphics } from "pixi.js";
import MoveableSolid from './moveableSolid'

class Sand extends MoveableSolid{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix){
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)

        let colors = [0xDBD49D, 0xC7C089, 0xDED7A1, 0xCCC78F, 0xE9E9AE];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }


}

export default Sand;