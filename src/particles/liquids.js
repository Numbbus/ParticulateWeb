import Gas from "./gas.js";
import Particle from "./particle.js";

class Liquid extends Particle{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
    {
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
        this.direction = Math.floor(Math.random() * 2);
        // 0 -> Right
        // 1 -> Left
        
        this.conductivity = 0.20;
    }

    move(){
        if(this.framesSinceLastUpdate == this.speed && !(this.movedThisFrame)){
            //console.log(`${this.getX()}, ${this.getY()}`);
            let bottom = this.getY()+1 < this.matrix.getRows() ? this.matrix.getParticle(this.x, this.y+1) : undefined ;
            let right = this.getX()+1 < this.matrix.getCols() ? this.matrix.getParticle(this.x+1, this.y) : undefined ;
            let left = this.getX()-1 >= 0 ? this.matrix.getParticle(this.x-1, this.y) : undefined ;
            let top = this.getY()-1 >= 0 ? this.matrix.getParticle(this.x, this.y-1) : undefined ;
            
            if( top && top instanceof Liquid && this.temp > top.temp){
                this.matrix.swapParticles(this.getX(), this.getY(), top.getX(), top.getY());
            }else{
                if(bottom === null || bottom instanceof Gas){ 
                    this.matrix.swapParticles(this.getX(), this.getY(), this.getX(), this.getY() + 1); 
                }
                else {
                    
                    if(left === null || left instanceof Gas && this.direction==1){ 
                        this.matrix.swapParticles(this.getX(), this.getY(), this.getX() - 1, this.getY()); 
                    }else if((left != null || left === undefined) && this.direction==1){
                        this.direction=0;
                    }else{
                        if(right === null || right instanceof Gas && this.direction==0){ 
                            this.matrix.swapParticles(this.getX(), this.getY(), this.getX() + 1, this.getY()); 
                        }else if((right != null || right === undefined) && this.direction==0){
                            this.direction=1;
                        }
                    }

                }
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

export default Liquid;

export { Liquid }