import Liquid from "./liquids.js";
import Particle from "./particle.js";
import Gas from "./gas.js"
import { VeyonWorker } from "./particles.js";

class Solid extends Particle{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp = 15){
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp)
    }
}

class StaticSolid extends Solid{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp = 15){
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp)
    }
}

class MoveableSolid extends Solid{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp = 15)
    {
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp)
        this.framesSinceLastUpdate = 0;
    }

    move(){
        if(this.framesSinceLastUpdate == this.speed && !(this.movedThisFrame)){

            let bottomTile = this.getY()+1 < this.matrix.getRows() ? this.matrix.getParticle(this.x, this.y+1) : null ;

            if(bottomTile === null || (bottomTile instanceof Liquid || bottomTile instanceof Gas)){
                this.matrix.swapParticles(this.getX(), this.getY(), this.getX(), this.getY()+1);
            }else if(bottomTile instanceof Solid){
                let bottomRight = this.matrix.getParticle(this.getX() + 1, this.getY() + 1);
                let bottomLeft = this.matrix.getParticle(this.getX() - 1, this.getY() + 1);

                let right = this.matrix.getParticle(this.getX() + 1, this.getY());
                let left = this.matrix.getParticle(this.getX() - 1, this.getY());

                let direction = Math.floor(Math.random()*2);

                if(direction == 1 && (bottomLeft === null || (bottomLeft instanceof Liquid || bottomLeft instanceof Gas)) && (left === null || left instanceof Liquid )){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX()-1, this.getY()); }
                else if(direction == 0 && (bottomRight === null || (bottomRight instanceof Liquid || bottomRight instanceof Gas )) && (right === null || right instanceof Liquid )){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX()+1, this.getY()); }
            }

            this.framesSinceLastUpdate = 0;
            this.movedThisFrame = true;

        }else if(this.movedThisFrame){
            this.movedThisFrame = false;

        }else{
            this.framesSinceLastUpdate++;
        }
    }

}

class StiffSolid extends MoveableSolid{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp = 15)
    {
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp)
    }

    move(){
        if(this.framesSinceLastUpdate == this.speed && !(this.movedThisFrame)){

            let bottomTile = this.getY()+1 < this.matrix.getRows() ? this.matrix.getParticle(this.x, this.y+1) : null ;

            if(bottomTile === null || (bottomTile instanceof Liquid || bottomTile instanceof Gas)){
                this.matrix.swapParticles(this.getX(), this.getY(), this.getX(), this.getY()+1);
            }

            this.framesSinceLastUpdate = 0;
            this.movedThisFrame = true;

        }else if(this.movedThisFrame){
            this.movedThisFrame = false;

        }else{
            this.framesSinceLastUpdate++;
        }
    }

}

class Spawner extends Solid{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, spawnersParticle)
    {
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix);
        this.framesSinceLastUpdate = 0;
        this.spawnersParticle = spawnersParticle;

        this.direction = 1;
    }

    move(){};
    
    action(){
        if(this.direction == -1){
            let topTile = this.getY()-1 >= 0 ? this.matrix.getParticle(this.x, this.y-1) : undefined ;

            if(topTile === null){
                this.matrix.createParticle(this.x, this.y-1, this.spawnersParticle);
            }
        }else{
            let bottomTile = this.getY()+1 < this.matrix.getRows() ? this.matrix.getParticle(this.x, this.y+1) : undefined ;

            if(bottomTile === null){
                this.matrix.createParticle(this.x, this.y+1, this.spawnersParticle);
            }
        
        }

        
    };

}

class Void extends Solid{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, voidParticle)
    {
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix);
        this.framesSinceLastUpdate = 0;
        this.voidParticle = voidParticle;
    }

    move(){};
    
    action(){
        let neighbors = this.getNeighbors();
        let neighbor = undefined;

        for(let n of neighbors){
            if(n.particle && n.particle instanceof VeyonWorker){
                return;
            }
            if(!(n.particle instanceof Void) && n.particle instanceof this.voidParticle){
                this.matrix.replaceParticle(n.x, n.y, null);
            }
        }
        
    };

}

export default Solid;

export { Solid, StaticSolid, MoveableSolid, StiffSolid, Spawner, Void }