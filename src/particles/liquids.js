import Gas from "./gas.js";
import Particle from "./particle.js";

class Liquid extends Particle{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
    {
        super(x, y, isFlammable, isDestructable, toughness, speed, app, matrix)
        this.direction = Math.floor(Math.random() * 2);
        console.log(this.direction);
        // 0 -> Right
        // 1 -> Left
        
        this.conductivity = 0.20;

        this.density = 1;
    }

    move(){
        if(this.app.tick - this.lastUpdatedTick < this.speed) return;
        this.lastUpdatedTick = this.app.tick;
        let neighbors = this.getNeighbors();

        let top = neighbors.find(n => n.y === this.y - 1)?.particle;
        let right = neighbors.find(n => n.x === this.x + 1)?.particle;
        let left = neighbors.find(n => n.x === this.x - 1)?.particle;
        let bottom = neighbors.find(n => n.y === this.y + 1)?.particle;

        if(bottom === null){
            this.matrix.swapParticles(this.x, this.y, this.x, this.y + 1);
        }else{
            if(this.direction === 0){
                if(right === null){
                    this.matrix.swapParticles(this.x, this.y, this.x + 1, this.y);
                }else if(right || right == undefined) {
                    this.direction = 1;
                }
            }else{
                if(left === null){
                    this.matrix.swapParticles(this.x, this.y, this.x - 1, this.y);
                }else if(left || left == undefined){
                    this.direction = 0;
                }
            }
        }
            
    }
}

export default Liquid;

export { Liquid }