import { MoveableSolid, StaticSolid } from "./solids.js";
import { Liquid } from "./liquids.js";
import Gas from "./gas.js";

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

class Bedrock extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0x323232, 0x3A3A3A, 0x404040, 0x464646, 0x4E4E4E]
;

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

class Ice extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0xB4FFFF, 0x82E6FF, 0x8CEBFF];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

class Obsidian extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0x1A1A1A, 0x181818, 0x161616];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

class Tnt extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0xC80000, 0xDC0000, 0xFF0000, 0xFF1E1E, 0xFF3C3C];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

class Wood extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0x814012, 0x864313, 0x8B4513, 0x914815, 0x964B16];

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

class Ash extends MoveableSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0xE6E6E6, 0xC8C8C8, 0xD7D7D7, 0xF0F0F0];

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

// Gases

class Steam extends Gas {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0xffffff];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

class Fire extends Gas {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        let colors = [0xFF8700, 0xFF8E00, 0xFF9600, 0xFF9E00, 0xFFA500];

        this.setColor(colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

// Misc

export default Sand;

export { Sand, Dirt, Stone, Water, Ash, Bedrock, Obsidian, Wood, Tnt, Ice, Steam, Fire };