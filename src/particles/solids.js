import Liquid from "./liquids.js";
import Particle from "./particle.js";
import Gas from "./gas.js"

class Solid extends Particle{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix){
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
    }
}

class StaticSolid extends Solid{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix){
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
    }

    action(){};
}

class MoveableSolid extends StaticSolid{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
    {
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
        this.framesSinceLastUpdate = 0;
    }

    move(){
        if(this.framesSinceLastUpdate == this.speed && !(this.movedThisFrame)){
            //console.log(`${this.getX()}, ${this.getY()}`);
            let bottomTile = this.getY()+1 < this.matrix.getRows() ? this.matrix.getParticle(this.x, this.y+1) : undefined ;

            if(bottomTile === null || bottomTile instanceof Liquid){
                this.matrix.swapParticles(this.getX(), this.getY(), this.getX(), this.getY()+1);
            }else if(bottomTile instanceof Solid){
                let bottomRight = this.matrix.getParticle(this.getX() + 1, this.getY() + 1);
                let bottomLeft = this.matrix.getParticle(this.getX() - 1, this.getY() + 1);

                let right = this.matrix.getParticle(this.getX() + 1, this.getY());
                let left = this.matrix.getParticle(this.getX() - 1, this.getY());

                let direction = Math.floor(Math.random()*2);

                if(direction == 1 && (bottomLeft === null || bottomLeft instanceof Liquid) && (left === null || left instanceof Liquid )){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX()-1, this.getY()); }
                else if(direction == 0 && (bottomRight === null || bottomRight instanceof Liquid) && (right === null || right instanceof Liquid )){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX()+1, this.getY()); }
            }

            this.framesSinceLastUpdate = 0;
            this.movedThisFrame = true;

        }else if(this.movedThisFrame){
            this.movedThisFrame = false;

        }else{
            this.framesSinceLastUpdate++;
        }
    }

    action(){

    }
}

class Spawner extends Solid{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, spawnersParticle)
    {
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix);
        this.framesSinceLastUpdate = 0;
        this.spawnersParticle = spawnersParticle;
    }

    move(){};
    
    action(){
        let bottomTile = this.getY()+1 < this.matrix.getRows() ? this.matrix.getParticle(this.x, this.y+1) : undefined ;

        if(bottomTile === null){
            this.matrix.createParticle(this.x, this.y+1, this.spawnersParticle);
        }
        
        
    };

}

export default Solid;

export { Solid, StaticSolid, MoveableSolid, Spawner }