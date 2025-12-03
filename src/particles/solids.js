import Particle from "./particle";


class Solid extends Particle{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix){
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
    }
}


class StaticSolid extends Solid{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix){
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
    }

    move(){ console.log("Static move"); }
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

            if(bottomTile === null){
                this.matrix.swapParticles(this.getX(), this.getY(), this.getX(), this.getY()+1);
            }else if(bottomTile instanceof Solid){
                let bottomRight = this.matrix.getParticle(this.getX() + 1, this.getY() + 1);
                let bottomLeft = this.matrix.getParticle(this.getX() - 1, this.getY() + 1);

                if(bottomLeft === null){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX()-1, this.getY()+1); }
                else if(bottomRight === null){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX()+1, this.getY()+1); }
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

export default Solid;

export { Solid, StaticSolid, MoveableSolid }