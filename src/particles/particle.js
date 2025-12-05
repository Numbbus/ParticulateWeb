const { Graphics } = PIXI;

class Particle{
    constructor(x, y, isFlammable, isDestructable, toughness, speed, app, matrix){
        this.x = x;
        this.y = y;
        this.isFlammable = isFlammable;
        this.isDestructable = isDestructable;
        this.toughness = toughness;
        this.movedThisFrame = false;

        this.speed = speed;
        this.framesSinceLastUpdate = 0;

        this.app = app;
        this.matrix = matrix;

        this.tileSize = matrix.getTileSize();
        this.containers = matrix.getContainers();

        this.rect = new Graphics().rect(0, 0, this.tileSize, this.tileSize);
    }


    move(){}
    action(){}

    setColor(colors){
        let i = Math.floor(Math.random() * colors.length);

        this.rect.fill(colors[i]);
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
}

export default Particle;
