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

        this.rect.fill(colors[i]);
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
}

export default Particle;
