
class Matrix {
    constructor(app, containers){

        this.app = app;
        this.containers = containers;

        this.tileSize = 5;

        // Initialize matrix to size of the canvas with null values
        this.rows = Math.trunc(containers.playArea.height / this.tileSize);
        this.cols = Math.trunc(containers.playArea.width / this.tileSize);

        this.matrix = []

        for (let r = 0; r < this.rows; r++)
        {
            this.matrix[r] = [];
            for(let c = 0; c < this.cols; c++)
            {
                this.matrix[r][c] = null;
            }
        }
    }

    updateGrid(){
        for (let r = this.rows-1; r >= 0; r--)
        {
            for(let c = this.cols-1; c >= 0; c--)
            {
                if(this.getParticle(c, r) != null){
                    this.matrix[r][c].move();
                }
            }
        }
    }

    createParticle(x, y, ParticleClass){
        if(this.withinBounds(x, y)){
            if(ParticleClass === null){ this.deleteParticle(x, y) }

            else if(this.matrix[y][x] === null){
                this.matrix[y][x] = new ParticleClass(x, y,this.app, this);
            }
        } 
    }

    deleteParticle(x, y){
        let p = this.matrix[y][x];

        if(p != null){
            p.getRect().destroy();
            this.matrix[y][x] = null;
        }
    }

    createMultipleParticles(x, y, a, ParticleClass){
        
    }

    swapParticles(x1, y1, x2, y2){
        let p1 = this.getParticle(x1, y1);
        let p2 = this.getParticle(x2, y2);

        if(p2 == null){
            this.matrix[y2][x2] = p1;
            this.matrix[y1][x1] = null;
            p1.setPosition(x2, y2);
        }
        else{
            this.matrix[y2][x2] = p1;
            this.matrix[y1][x1] = p2;
            p1.setPosition(x2, y2);
            p2.setPosition(x1, y1); 
        }
    }


    traverseMatrix(startX, startY, endX, endY){
        
        // Distances between the points
        let dx = endX - startX;
        let dy = endY - startY;

        let allCoords = [];

        if (Math.abs(dx) >= Math.abs(dy)) {
            // Iterate over x
            if (startX > endX) {
                // Swap points to ensure increasing x
                let tempX = startX
                let tempY = startY;

                startX = endX; 
                startY = endY;

                endX = tempX; 
                endY = tempY;

                dx = endX - startX;
                dy = endY - startY;
            }

            let s = dy / dx;
            let slope = Number.isNaN(s) ? 0 : s;
            

            for (let x = startX; x <= endX; x++) {
                let y = startY + slope * (x - startX);

                allCoords.push([x, Math.round(y)])
            }
        }else {
            // Iterate over y
            if (startY > endY) {
                // Swap points to ensure increasing y
                let tempX = startX
                let tempY = startY;
                
                startX = endX; 
                startY = endY;

                endX = tempX; 
                endY = tempY;

                dx = endX - startX;
                dy = endY - startY;
            }

            let invSlope = dx / dy;

            for (let y = startY; y <= endY; y++) {
                let x = startX + invSlope * (y - startY);
                allCoords.push([x, Math.round(y)])
            }
        }

        return allCoords;
    }

    traverseMatrixAndCreate(startX, startY, endX, endY, p){
        
        // Distances between the points
        let dx = endX - startX;
        let dy = endY - startY;

        if (Math.abs(dx) >= Math.abs(dy)) {
            // Iterate over x
            if (startX > endX) {
                // Swap points to ensure increasing x
                let tempX = startX
                let tempY = startY;

                startX = endX; 
                startY = endY;

                endX = tempX; 
                endY = tempY;

                dx = endX - startX;
                dy = endY - startY;
            }

            let s = dy / dx;
            let slope = Number.isNaN(s) ? 0 : s;
            

            for (let x = startX; x <= endX; x++) {
                let y = startY + slope * (x - startX);

                this.createParticle(x, Math.round(y), p);
            }
        }else {
            // Iterate over y
            if (startY > endY) {
                // Swap points to ensure increasing y
                let tempX = startX
                let tempY = startY;
                
                startX = endX; 
                startY = endY;

                endX = tempX; 
                endY = tempY;

                dx = endX - startX;
                dy = endY - startY;
            }

            let invSlope = dx / dy;

            for (let y = startY; y <= endY; y++) {
                let x = startX + invSlope * (y - startY);
                this.createParticle(x, Math.round(y), p);
            }
        }
    }

    resetMatrix(){
        this.matrix = []

        for (let r = 0; r < this.rows; r++)
        {
            this.matrix[r] = [];
            for(let c = 0; c < this.cols; c++)
            {
                this.matrix[r][c] = null;
            }
        }
    }

    setParticle(x, y, p){
        this.matrix
    }

    withinBounds(x, y){
        return ((x < this.getCols() && x >=0) && (y < this.getRows() && y >= 0));
    }

    getContainers(){ return this.containers; }


    getParticle(x, y)
    { 
        return this.matrix[y][x]; 
    }

    getTileSize(){ return this.tileSize; }

    getRows(){ return this.rows; }
    getCols(){ return this.cols; }

    addParticle(x, y, p){
        this.matrix[y][x] = p;
        this.addToStage(p);
    }


    addToStage(obj){
        this.app.stage.addChild(obj);
    }
}

export default Matrix;