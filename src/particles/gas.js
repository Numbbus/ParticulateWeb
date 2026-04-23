import Particle from "./particle.js";

class Gas extends Particle{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp = 15)
    {
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp)
        this.direction = 0;
        // 0 -> Right
        // 1 -> Left
        
        this.conductivity = 0.10;
    }

    move(){
        if(this.framesSinceLastUpdate == this.speed && !(this.movedThisFrame)){
            //console.log(`${this.getX()}, ${this.getY()}`);

            let dir = Math.floor(Math.random() * 3);

            let top = this.getY()-1 >= 0 ? this.matrix.getParticle(this.x, this.y-1) : undefined ;
            let right = this.matrix.getParticle(this.getX() + 1, this.getY());
            let left = this.matrix.getParticle(this.getX() - 1, this.getY());

            if(dir == 0 && (top === null || top instanceof Gas)){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX(), this.getY() - 1); }
            else if(dir == 1 && (left === null || left instanceof Gas)){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX() - 1, this.getY()); }
            else if(dir == 2 && (right === null || right instanceof Gas)){ this.matrix.swapParticles(this.getX(), this.getY(), this.getX() + 1, this.getY()); }

            this.framesSinceLastUpdate = 0;
            this.movedThisFrame = true;

        }else if(this.movedThisFrame){
            this.movedThisFrame = false;

        }else{
            this.framesSinceLastUpdate++;
        }
    }
}

export default Gas;

export { Gas }