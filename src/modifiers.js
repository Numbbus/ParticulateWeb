class Modifier {
    constructor(matrix, app, containers, x, y){
        this.matrix = matrix;
        this.app = app;
        this.containers = containers;

        this.x = x;
        this.y = y;
    }

    action(){}

    
}

export class HeatRay extends Modifier {
    constructor(matrix, app, containers, x, y){
        super(matrix, app, containers, x, y);
    }

    action(){
        let p = this.matrix.getParticle(this.x, this.y)

        if(p !== null ){
            p.raiseTemp(5);
            //p.setColor([p.getThermalColor()]);
        }
    }
}

export class FreezeRay extends Modifier {
    constructor(matrix, app, containers, x, y){
        super(matrix, app, containers, x, y);
    }

    action(){
        let p = this.matrix.getParticle(this.x, this.y)

        if(p !== null ){
            p.raiseTemp(-1);
            //p.setColor([p.getThermalColor()]);
        }
    }
}

export class Shock extends Modifier {
    constructor(matrix, app, containers, x, y){
        super(matrix, app, containers, x, y);
    }

    action(){
        let p = this.matrix.getParticle(this.x, this.y)

        if(p !== null && (p.conductive || p.powerable)){
            p.shock();
            //p.setColor([p.getThermalColor()]);
        }
    }
}

export default Modifier;