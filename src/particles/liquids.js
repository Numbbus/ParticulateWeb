import Particle from "./particle.js";

class Liquid extends Particle{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
    {
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
        this.direction = 0;
        // 0 -> Right
        // 1 -> Left
        
    }

    move(){
        if(this.framesSinceLastUpdate == this.speed && !(this.movedThisFrame)){
            //console.log(`${this.getX()}, ${this.getY()}`);
            let bottom = this.getY()+1 < this.matrix.getRows() ? this.matrix.getParticle(this.x, this.y+1) : undefined ;
            let right = this.matrix.getParticle(this.getX() + 1, this.getY());
            let left = this.matrix.getParticle(this.getX() - 1, this.getY());

            if(bottom === null){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX(), this.getY() + 1); }
            else if(left === null){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX() - 1, this.getY()); }
            else if(right === null){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX() + 1, this.getY()); }

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

export default Liquid;

export { Liquid }