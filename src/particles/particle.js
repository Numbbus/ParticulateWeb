const { Graphics } = PIXI;

class Particle{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix){
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

        this.temp = 15; // 15 celcius 
        this.autoIgnitionTemp = null;
        this.meltingTemp = null;
        this.boilingPoint = null
        this.condenseTemp = null;
        this.freezingPoint = null;
    }


    move(){}
    action(){}

    getNeighbors(){
        let neighbors = [];
        
        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],          [1, 0],
            [-1, 1], [0, 1], [1, 1]
        ];

        for (const [dx, dy] of directions) {
            const nRow = this.y + dy;
            const nCol = this.x + dx;

                if(this.matrix.withinBounds(nCol, nRow)){
                    neighbors.push(this.matrix.getParticle(nCol, nRow));
                }
        }

        return neighbors;
    }

setColor(colors){
    let i = Math.floor(Math.random() * colors.length);
    const newColor = colors[i];

    if(this.color === newColor) return;

    this.color = newColor;

    this.rect.clear();
    this.rect.rect(0, 0, this.tileSize, this.tileSize);
    this.rect.fill(this.color);
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
        console.log(this.rect.x);
    }
    setY(n)
    { 
        this.y = n; 
        this.rect.y = n*this.tileSize;
        console.log(this.rect.y);
    }

    addToStage(obj){
        this.containers.playArea.addChild(obj);
    }

    raiseTemp(d){
        this.temp += d;
        
        let hovered = this.matrix.withinBounds(this.x, this.y) ? this.matrix.getParticle(this.x, this.y) : null;
        document.getElementById('particleTempDiv').innerText = `${hovered == null || hovered == undefined ? '' : 'Temp: '+hovered.getTemp()+'C°' }`;
    }

    getTemp(){
        return this.temp;
    }

    radiateHeat() {
        const neighbors = this.getNeighbors();

        for (let neighbor of neighbors) {
            if (!neighbor) continue;

            const diff = this.temp - neighbor.temp;

            const flow = diff * this.conductivity * 0.1; // 0.1 = dt

            this.temp -= flow;
            neighbor.temp += flow;
        }
    }

    getThermalColor(){
        const minTemp = -200;
        const maxTemp = 1000;

        let t = (this.temp - minTemp) / (maxTemp - minTemp);
        t = Math.max(0, Math.min(1, t)); // clamp 0–1

        const gradient = [
            [0, 0, 255],   // blue
            [0, 255, 255], // cyan
            [0, 255, 0],   // green
            [255, 255, 0], // yellow
            [255, 0, 0]    // red
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
