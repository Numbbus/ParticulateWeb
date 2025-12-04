import { MoveableSolid, StaticSolid } from "./solids";
import { Liquid } from "./liquids";

// Teplate for easy copying
/*
class Class extends Class {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}
*/


// Solids

class Stone extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0x8C8C8C, 0x828282];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

// Moveable Solids

class Sand extends MoveableSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0xDBD49D, 0xC7C089, 0xDED7A1, 0xCCC78F, 0xE9E9AE];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

class Dirt extends MoveableSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0x964B00, 0xA05014, 0x8C4614, 0x823C0A, 0x9B550F];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

// Liquids

class Water extends Liquid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [ 0x0000E6, 0x0000F0, 0x0000FA, 0x0000FF, 0x0A0AFF ];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

// Misc

export default Sand;

export { Sand, Dirt, Stone, Water };