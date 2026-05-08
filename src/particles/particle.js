const { Graphics } = PIXI;

class Particle{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix, temp = 15){
        this.x = x;
        this.y = y;
        this.isFlammable = isFlammable;
        this.isDestructable = isDestructable;
        this.toughness = toughness;
        this.movedThisFrame = false;

        this.inertia = 0;

        this.speed = speed;
        this.framesSinceLastUpdate = 0;

        this.colors = [];

        this.app = app;
        this.matrix = matrix;

        this.tileSize = matrix.getTileSize();
        this.containers = matrix.getContainers();

        this.rect = new Graphics().rect(0, 0, this.tileSize, this.tileSize);

        this.temp = temp; // 15 celcius 
        this.autoIgnitionTemp = null;
        this.meltingTemp = null;
        this.boilingPoint = null
        this.condenseTemp = null;
        this.freezingPoint = null;

        this.heatConductivity = 0.25;

        this.conductive = false;
    }


    move(){};
    action(){ this.radiateHeat(); };
    shock(){};

    getNeighbors() {
        if(!this.matrix){return null;}
        const neighbors = [];

        const directions = [
                      [0, -1],
            [-1,  0],          [1,  0],
                      [0,  1]
        ];

        for (const [dx, dy] of directions) {
            const x = this.x + dx;
            const y = this.y + dy;

            if (this.matrix.withinBounds(x, y)) {
                neighbors.push({
                    x,
                    y,
                    particle: this.matrix.getParticle(x, y)
                });
            } else {
                neighbors.push({
                    x,
                    y,
                    particle: null
                });
            }
        }

        return neighbors;
    }

    setColor(colors){
        try{
            let i = Math.floor(Math.random() * colors.length);
            const newColor = colors[i];

            if(this.color === newColor) return;

            this.color = newColor;

            this.rect.clear();
            this.rect.rect(0, 0, this.tileSize, this.tileSize);
            this.rect.fill(this.color);
        }catch(e){}

    }

    destroyParticle(){
        if (this.rect) {
            if (this.rect.parent) {
                this.rect.parent.removeChild(this.rect);
            }
            this.rect.destroy();
            this.rect = null;
        }

        this.matrix = null;
        this.app = null;
    }

    getX(){ return this.x; }
    getY(){ return this.y; }

    setPosition(x, y) {
        this.x = x;
        this.y = y;

        this.rect.position.set(x * this.tileSize, y * this.tileSize);
    }

    setRect(r){ this.rect = r; }
    getRect(){ return this.rect; }

    getToughness(){ return this.toughness; }

    setX(n)
    { 
        this.x = n; 
        this.rect.x = n*this.tileSize;
    }
    setY(n)
    { 
        this.y = n; 
        this.rect.y = n*this.tileSize;
    }

    addToStage(obj){
        this.containers.playArea.addChild(obj);
    }

    raiseTemp(d){
        this.temp += d;
    }

    getTemp(){
        return this.temp;
    }

    radiateHeat() { 
        const neighbors = this.getNeighbors();

        for (let neighbor of neighbors) {
            if (!neighbor.particle) continue;

            // prevent double-processing pairs
            if (neighbor.x < this.x) continue;
            if (neighbor.x === this.x && neighbor.y < this.y) continue;

            const diff = this.temp - neighbor.particle.temp;
            const flow = diff * this.heatConductivity * 0.1;

            this.temp -= flow;
            neighbor.particle.temp += flow;
        }
    }

    getThermalColor(){
        const minTemp = -212;
        const maxTemp = 2000;

        let t = (this.temp - minTemp) / (maxTemp - minTemp);

        t = Math.max(0, Math.min(1, t)); // clamp 0–1

        const gradient = [
            // Loosely follow Rainbow thermal color pallet 
            [0, 1, 76],   
            [0, 92, 211], 
            [88, 179, 43],  
            [243, 202, 9], 
            [251, 24, 20],    
            [255, 255, 255]
        ];

        const scaled = t * (gradient.length - 1);
        const index = Math.floor(scaled);
        const frac = scaled - index;

        const c1 = gradient[index];
        const c2 = gradient[index + 1] || c1;

        const r = Math.floor(c1[0] + (c2[0] - c1[0]) * frac);
        const g = Math.floor(c1[1] + (c2[1] - c1[1]) * frac);
        const b = Math.floor(c1[2] + (c2[2] - c1[2]) * frac);

        return (r << 16) | (g << 8) | b;
    }
}

export default Particle;
