import { Solid, MoveableSolid, StaticSolid, Spawner, Void, StiffSolid } from "./solids.js";
import { Liquid } from "./liquids.js";
import Gas from "./gas.js";
import Particle from "./particle.js";

// Teplate for easy copying
/*
export class Class extends Class {
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
export class Stone extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 70, 0, app, matrix)

        this.colors = [0x8C8C8C, 0x828282];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }

    action(){
        this.radiateHeat();

        if(this.temp >= 1200){
                this.matrix.replaceParticle(this.x, this.y, Lava, this.temp);
        }
    }
}

export class Bedrock extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 90, 0, app, matrix)

        this.colors = [0x323232, 0x3A3A3A, 0x404040, 0x464646, 0x4E4E4E];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class Ice extends StaticSolid {
    constructor(x, y, app, matrix, temp = -20){
        super(x, y, false, true, 40, 0, app, matrix, temp)

        this.colors = [0xB4FFFF, 0x82E6FF, 0x8CEBFF];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.conductivity = 0.20;

        this.meltingTemp = 0;
        this.boilingPoint = 100;
    }

    action(){
        this.radiateHeat(); 

        if(this.temp >= 0){
            this.matrix.replaceParticle(this.x, this.y, Water);
        }else if(this.temp >= this.boilingPoint){
            this.matrix.replaceParticle(this.x, this.y, Steam);
        }
    }
}

export class Obsidian extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 60, 0, app, matrix)

        this.colors = [0x1A1A1A, 0x181818, 0x161616];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class Tnt extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 30, 0, app, matrix)

        this.triggers = ['Fire', 'Lava'];

        this.fuseLength = 50;
        this.isExploding = false;
        this.startTime = null;

        this.radius = 10;
        this.power = 90;

        this.colors = [0xC80000, 0xDC0000, 0xFF0000, 0xFF1E1E, 0xFF3C3C];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.autoIgnitionTemp = 250;
    }

    action(){
        //this.radiateHeat(); 

        const neighbors = this.getNeighbors();

        neighbors.forEach((n) => {
            if(n.particle != null && this.triggers.includes(`${n.particle.constructor.name}`)){
                this.isExploding = true;
            }
        });

        if(this.temp >= this.autoIgnitionTemp){
            this.isExploding = true;
        }

        if(this.isExploding){
            if(this.startTime == null){
                this.startTime = performance.now();
            }
            this.explode(this.matrix);
        }
    }

    explode(matrix){
        let elapsedTime = performance.now() - this.startTime;

        if(elapsedTime >= this.fuseLength){
            for(let r=this.y-this.radius; r < this.y+this.radius; r++){
                for(let c=this.x-this.radius; c < this.x+this.radius; c++){
                    let p = matrix.getParticle(c, r);

                    if(p != null){
                        if((Math.floor(Math.random() * 100) + 1) <= 100 - p.getToughness() + 50){

                            let distance = Math.sqrt((c - this.x)**2 + (r - this.y)**2);
                            let innerRad = Math.floor(this.radius/4);

                            if(distance <= innerRad){
                                Math.random() <= 0.6
                                    ? matrix.createParticle(c, r, Fire, true)
                                    : matrix.createParticle(c, r, Smoke, true);
                            }
                            else if(distance <= this.radius){
                                let probability = Math.pow(1 - (distance / this.radius), 0.05);

                                if(Math.random() < probability){
                                    if(p instanceof Tnt){
                                        p.isExploding = true;
                                        continue;
                                    } else {
                                        Math.random() <= 0.5
                                            ? matrix.createParticle(c, r, Fire, true)
                                            : matrix.createParticle(c, r, Smoke, true);
                                    }
                                }
                            }
                        }
                    } else {
                        Math.random() <= 0.3
                            ? matrix.createParticle(c, r, Fire, true)
                            : matrix.createParticle(c, r, Smoke, true);
                    }
                }
            }
        }
    }
}

export class Wood extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, true, true, 40, 0, app, matrix)

        this.colors = [0xae8f55, 0xb7945e, 0xc29e63];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.lastBurnTime = 0;

        this.triggers = ['Fire','Lava'];

        this.conductivity = 0.12;

        this.autoIgnitionTemp = 450;
    }

    action(){
        this.radiateHeat(); 

        if(this.temp >= this.autoIgnitionTemp){
            this.burning = true;
        }else if(this.temp >= this.autoIgnitionTemp + 450){this.matrix.replaceParticle(this.x, this.y, Fire);}


        const neighbors = this.getNeighbors();

        for( let n of neighbors){
            if(n.particle && this.triggers.includes(`${n.particle.constructor.name}`)){
                if(n.particle instanceof Water){
                    this.burning = false;
                }else{
                    this.burning = true;
                    this.lastBurnTime = performance.now();
                }
            }
        }

        if (this.burning) {
            const now = performance.now();

            if (now - this.lastBurnTime >= 1000) {

                let chance = Math.random() * 100;

                if (chance < 50) {
                    let index = Math.floor(Math.random() * 8);
                    let n = neighbors[index];

                    if(n.particle == null){
                        this.matrix.createParticle(n.x, n.y, Fire);
                    }
                }else{
                    if(chance <= 60){
                        chance = Math.random() * 100;
                        if (chance <= 70) {
                            this.matrix.replaceParticle(this.x, this.y, Charcoal, this.temp).burning = true;
                            return;
                        } else if (chance <= 90) {
                            this.matrix.replaceParticle(this.x, this.y, Ash, this.temp);
                            return;
                        } else {
                            this.matrix.deleteParticle(this.x, this.y);
                            return;
                        }

                    }
                }
                this.temp += 5;
                this.lastBurnTime = now;
            }
        }
    }
}

export class MudWall extends StaticSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        this.colors = [0x73390F, 0x783D00, 0x703810];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}


// Moveable Solids

export class Sand extends MoveableSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 20, 0, app, matrix)

        this.colors = [0xDBD49D, 0xC7C089, 0xDED7A1, 0xCCC78F, 0xE9E9AE];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.triggers = ['Water']
    }

    action(){
        this.radiateHeat();

        const neighbors = this.getNeighbors();

        for( let n of neighbors){
            if(n.particle && this.triggers.includes(`${n.particle.constructor.name}`)){
                this.matrix.deleteParticle(n.x, n.y);
                this.matrix.replaceParticle(this.x, this.y, WetSand);
                return;
            }
        }
    }
}

export class Dirt extends MoveableSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 25, 0, app, matrix)

        this.colors = [0x964B00, 0xA05014, 0x8C4614, 0x823C0A, 0x9B550F];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
        
        this.triggers = ['Water'];
    
    }

    action(){
        this.radiateHeat();

        const neighbors = this.getNeighbors();

        for( let n of neighbors){
            if(n && n.particle && this.triggers.includes(`${n.particle.constructor.name}`)){
                this.matrix.deleteParticle(n.x, n.y);
                this.matrix.replaceParticle(this.x, this.y, Mud);
                return;
            }
        }
    }
}

export class Ash extends MoveableSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 10, 0, app, matrix)

        this.colors = [0xE6E6E6, 0xC8C8C8, 0xD7D7D7, 0xF0F0F0];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class Gravel extends MoveableSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 10, 0, app, matrix)

        this.colors = [0x8B8B8B, 0xA3A3A3, 0x6E6E6E, 0x5E5E5E, 0xBFBFBF];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class Charcoal extends MoveableSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 10, 0, app, matrix)

        this.colors = [0x080808, 0x121212, 0x1c1c1c, 0x262626, 0x303030];

        this.triggers = ['Fire', 'Lava'];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.burning = false;

        this.autoIgnitionTemp = 350;
    }

    action(){
        this.radiateHeat(); 

        if(this.temp >= this.autoIgnitionTemp){
            this.burning = true;
        }else if(this.temp >= this.autoIgnitionTemp + 1000){this.matrix.replaceParticle(this.x, this.y, Fire);}


        const neighbors = this.getNeighbors();

        for( let n of neighbors){
            if(n.particle && this.triggers.includes(`${n.particle.constructor.name}`)){
                if(n.particle instanceof Water){
                    this.burning = false;
                }else{
                    this.burning = true;
                    this.lastBurnTime = performance.now();
                }
            }
        }

        if (this.burning) {
            const now = performance.now();

            if (now - this.lastBurnTime >= 1000) {

                let chance = Math.random() * 100;

                if (chance < 50) {
                    let top = this.matrix.getParticle(this.x, this.y - 1);
                    if (top == null) {
                        this.matrix.createParticle(this.x, this.y-1, Fire);
                    }
                }else{
                    if(chance <= 60){
                        chance = Math.random() * 100;
                        if (chance <= 20) {
                            this.matrix.replaceParticle(this.x, this.y, Ash);
                            return;
                        } else {
                            this.matrix.deleteParticle(this.x, this.y);
                            return;
                        }

                    }
                }
                this.temp += 7;
                this.lastBurnTime = now;
            }
        }
    }
}

// Stiff Solids
export class Mud extends StiffSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        this.colors = [0x401F00, 0x542B0D, 0x452200];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    
        this.triggers = ['Water'];
    }

    action(){
        this.radiateHeat(); 

        if(this.temp >= 20){
            if(Math.random() * 100 < (10 + this.temp)){
                this.matrix.replaceParticle(this.x, this.y, Dirt);
                return;
            }
        }

        this.radiateHeat(); 
        
        if(this.temp >= 20){
            if(Math.random() * 100 < (10 + this.temp)){
                this.matrix.replaceParticle(this.x, this.y, Dirt);
                return;
            }
        }

        const now = performance.now();

        if (now - this.lastTransferAttempt >= 5000) {
            const neighbors = this.getNeighbors();

            for( let n of neighbors){
                if(n && n.particle && this.triggers.includes(`${n.particle.constructor.name}`)){
                    if(n.y >= this.y && n.particle instanceof Dirt){
                        let chance = Math.random() * 100;
                        if(chance <= 20){
                            this.matrix.replaceParticle(n.x, n.y, Mud);
                            this.matrix.replaceParticle(this.x, this.y, Dirt);
                            return;
                        }
                    }
                }
            }
            this.lastTransferAttempt = now;
        }
    }
}

export class WetSand extends StiffSolid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        this.colors = [0xB8B17F, 0xA9A274, 0xC2BB88, 0x9F996B, 0xD0C98F];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.lastTransferAttempt = 0;

        this.triggers = ['Sand'];
    }

    action(){
        this.radiateHeat(); 
        
        if(this.temp >= 50){
            if(Math.random() * 100 < (10 + this.temp)){
                this.matrix.replaceParticle(this.x, this.y, Sand);
            }
        }

        const now = performance.now();

        if (now - this.lastTransferAttempt >= 5000) {
            const neighbors = this.getNeighbors();

            if(neighbors){
                for( let n of neighbors){
                    if(n.particle && this.triggers.includes(`${n.particle.constructor.name}`)){
                        if(n.y >= this.y && n.particle instanceof Sand){
                            let chance = Math.random() * 100;
                            if(chance <= 20){
                                this.matrix.replaceParticle(n.x, n.y, WetSand);
                                this.matrix.replaceParticle(this.x, this.y, Sand);
                                return;
                            }
                        }
                    }
                }
            }


            this.lastTransferAttempt = now;
        }
    }
}


// Liquids

export class Water extends Liquid {
    constructor(x, y, app, matrix, temp = 15){
        super(x, y, false, true, 5, 0, app, matrix, temp)

        this.colors = [0x0000E6, 0x0000F0, 0x0000FA, 0x0000FF, 0x0A0AFF];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    
        this.conductivity = 0.6;

        this.boilingPoint = 212;
        this.freezePoint = 0;
    }

    action(){
        this.radiateHeat(); 

        if(this.temp >= this.boilingPoint){
            this.matrix.replaceParticle(this.x, this.y, Steam, this.temp + 50);
        } else if(this.temp <= this.freezePoint){
            this.matrix.replaceParticle(this.x, this.y, Ice, this.temp - 10);
        }
    }
}

export class Lava extends Liquid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        this.colors = [0xFFB900, 0xFFC000, 0xFFC800, 0xFFD000, 0xFFD700];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.conductivity = 0.8

        this.temp = 1500;
    }

    action(){
        this.radiateHeat();

        if(this.temp <= 500){
                this.matrix.replaceParticle(this.x, this.y, Stone);
        }
    }
}

export class Alcohol extends Liquid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        this.colors = [0xC6C6CC, 0xC4C2C2, 0xC6C6CC];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.triggers = ['Fire', 'Lava']

        this.autoIgnitionTemp = 350;
    }

    action(){
        this.radiateHeat(); 

        if(this.temp >= this.autoIgnitionTemp){
            this.matrix.replaceParticle(this.x, this.y, Fire);
        }

        const neighbors = this.getNeighbors();

        for( let n of neighbors){
            if(n.particle && this.triggers.includes(`${n.particle.constructor.name}`)){
                this.matrix.replaceParticle(this.x, this.y, Fire);
                break;
            }
        }
    }
}

export class Acid extends Liquid {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        this.colors = [0x46D459, 0x3DD150, 0x4BDB5D];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }

    action(){
        this.radiateHeat(); 

        let neighbors = this.getNeighbors();

        neighbors.forEach((n) => {
            if(n.particle != null && !(n.particle instanceof Acid) && !(n.particle instanceof AcidSpawner)){
                this.matrix.deleteParticle(n.x, n.y);
            }
        });
    }
}


// Gases

export class Steam extends Gas {
    constructor(x, y, app, matrix, temp = 250){
        super(x, y, false, true, 5, 0, app, matrix, temp)

        this.colors = [0xffffff];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.condenseTemp = 200;

    }

    action(){ 
        this.radiateHeat(); 

        if(this.temp <= this.condenseTemp){
            this.matrix.replaceParticle(this.x, this.y, Water, this.temp);
        }
    }
}

export class Fire extends Gas {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        this.colors = [0xF33C04, 0xFE650D, 0xFFC11F, 0xFFF75D];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.conductivity = 0.50;

        this.temp = 800;
        this.life = Math.floor(Math.random() * (300 - 200)) + 400;
    }

    action(){
        this.radiateHeat(); 

        this.life--;
        

        if(this.life <= 0 && this.temp < 900){
            if(Math.floor(Math.random() * 100) + 1 <= 35){
                this.matrix.replaceParticle(this.x, this.y, Smoke, this.temp);
            } else {
                this.matrix.deleteParticle(this.x, this.y);
            }
        }
        else if(this.temp <= 500){
            if(Math.floor(Math.random() * 100) + 1 <= 35){
                this.matrix.replaceParticle(this.x, this.y, Smoke, this.temp);
            } else {
                this.matrix.deleteParticle(this.x, this.y);
            }
        }
    }
}

export class Smoke extends Gas {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        this.colors = [0x3B3B3B, 0x424242, 0x2E2E2E];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.life = Math.floor(Math.random() * (300 - 200)) + 200;
    }

    action(){
        this.radiateHeat(); 

        this.life--;
        

        if(this.life <= 0){
            this.matrix.deleteParticle(this.x, this.y);
        }
    }
}

export class Propane extends Gas {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 5, 0, app, matrix)

        this.colors = [0xfff2cc, 0xffe599, 0xfff7e6, 0xd9f2ff, 0xb3ecff]

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.autoIgnitionTemp = 500;

        this.triggers = ['Fire', 'Lava'];
    }

    action(){
        this.radiateHeat(); 

        if(this.temp >= this.autoIgnitionTemp){
            this.matrix.replaceParticle(this.x, this.y, Fire);
        }

        const neighbors = this.getNeighbors();

        if(neighbors){
            for( let n of neighbors){
                if(n.particle && this.triggers.includes(`${n.particle.constructor.name}`)){
                    this.matrix.replaceParticle(this.x, this.y, Fire);
                    return;
                }
            }
        }
    }
}


// Spawners

export class SandSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Sand)

        this.colors = [0xff0000];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class DirtSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Dirt)

        this.colors = [0xFFFF00];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class AshSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Ash)

        this.colors = [0x0F7D0F];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class WaterSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Water)

        this.colors = [0x00FFFF];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class SteamSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Steam)

        this.colors = [0xeeeeee];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.direction = -1;
    }
}

export class FireSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Fire)

        this.colors = [0xFF00FF];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.life = 5;
        this.direction = -1;
    }
}

export class SmokeSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Smoke)

        this.colors = [0xA9A9A9];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.life = 5;
        this.direction = -1;
    }
}

export class PropaneSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Propane)

        this.colors = [0xC5D600];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.life = 5;
        this.direction = -1;
    }
}

export class LavaSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Lava)

        this.colors = [0xE88B00];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.life = 5;
        this.direction = 1;
    }
}

export class AcidSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Acid)

        this.colors = [0x04E800];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.life = 5;
        this.direction = 1;
    }
}

export class AlcoholSpawner extends Spawner {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Alcohol)

        this.colors = [0x04E800];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);

        this.life = 5;
        this.direction = 1;
    }
}


// Void Blocks

export class VoidBlock extends Void {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Particle)

        this.colors = [0xae34fa];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class VoidSolidsBlock extends Void {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Solid)
 
        this.colors = [0xB52300];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class VoidLiquidsBlock extends Void {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Liquid)
 
        this.colors = [0x134A00];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}

export class VoidGassesBlock extends Void {
    constructor(x, y, app, matrix){
        super(x, y, false, true, 50, 0, app, matrix, Gas)

        this.colors = [0x360034];

        this.setColor(this.colors);
        this.rect.position.set(this.x * this.tileSize, this.y * this.tileSize);
        this.addToStage(this.rect);
    }
}