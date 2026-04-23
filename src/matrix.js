import Particle from "./particles/particle.js";
import Modifier from "./modifiers.js";

class Matrix {
    constructor(app, containers){

        this.app = app;
        this.containers = containers;

        this.tileSize = 6;

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

    updateGrid(view){
        for (let r = this.rows-1; r >= 0; r--)
        {
            for(let c = this.cols-1; c >= 0; c--)
            {
                let p = this.getParticle(c, r);
                if(p != null){
                    p.move();
                    p.action();
                    if(view == 'thermal'){
                        p.setColor([p.getThermalColor()]);
                    }
                }
            }
        }
    }

    createParticle(x, y, ParticleClass, override, temp){
        if(this.withinBounds(x, y)){
            if(ParticleClass == null || ParticleClass.prototype instanceof Particle){
                if(ParticleClass === null){ this.deleteParticle(x, y) }

                else if(this.matrix[y][x] === null || override){
                    if(override){
                        this.deleteParticle(x, y);
                    }
                    if (temp !== undefined) {
                        this.matrix[y][x] = new ParticleClass(x, y, this.app, this, temp);
                    } else {
                        this.matrix[y][x] = new ParticleClass(x, y, this.app, this);
                    }
                }
            }else if(ParticleClass.prototype instanceof Modifier){
                let m = new ParticleClass(this, this.app, this.containers, x, y);
                m.action();
            }

        } 
    }

    deleteParticle(x, y){
        const p = this.matrix[y][x];
        if (!p) return;

        p.destroyParticle(); 
        this.matrix[y][x] = null;
    }

    replaceParticle(x, y, p, t){
        this.deleteParticle(x, y);
        this.createParticle(x, y, p, false, t || 15);
    }


    swapParticles(x1, y1, x2, y2){         
        if(this.withinBounds(x1, y1) && this.withinBounds(x2, y2)){
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
                allCoords.push([Math.round(x), y])
            }
        }

        return allCoords;
    }

    traverseMatrixAndCreate(startX, startY, endX, endY, p, override){    

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

                this.createParticle(x, Math.round(y), p, override);
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
                this.createParticle(Math.round(x), y, p, override);
            }
        }
    

    }

    fillBrushArea(p, brushSize, coords, override){
        //const coords = this.traverseMatrix(startX, startY, endX, endY);

        for(let c = 0; c < coords.length; c++){
            this.drawBrush(coords[c][0], coords[c][1], coords[c][0]+brushSize, coords[c][1]+brushSize, p, override);
        }

    }

    drawBrush(startX, startY, endX, endY, p, override){
        for(let i = startY; i < endY; i++){
            this.traverseMatrixAndCreate(startX, i, endX-1 , i   , p, override);
        }
    }

    resetMatrix(){
        for (let r = 0; r < this.rows; r++)
        {
            for(let c = 0; c < this.cols; c++)
            {
                this.deleteParticle(c, r);
            }
        }
    }

    setParticle(x, y, p){
        if(this.withinBounds(x, y)){
            this.matrix[y][x] = p;
        }
        
    }

    withinBounds(x, y){
        return ((x < this.getCols() && x >=0) && (y < this.getRows() && y >= 0));
    }

    getContainers(){ return this.containers; }


    getParticle(x, y)
    { 
        if(this.withinBounds(x, y)){
            try{ if(this.matrix[y][x] === undefined){ return undefined; } } catch(e){ return undefined; }
            return this.matrix[y][x]; 
        }
        
        return null;
        
    }

    getGrid(){ return this.matrix; }

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