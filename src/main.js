import { Application, EventSystem } from "pixi.js";

import Matrix from './matrix.js' ;
import Sand from './particles/solids/moveableSolids/sand.js'

let mouseDown = false;
let mouseX = null;
let mouseY = null;

let previouseMouseX = null;
let previouseMouseY = null;

(async () => {
    const app = new Application();
    await app.init({
        width: 1500,
        height: 800,
    });
    document.body.appendChild(app.canvas);
    app.renderer.events = new EventSystem(app.renderer);

    const matrix = new Matrix(app)



    app.ticker.add(gameLoop);

    function gameLoop(){
        //console.log('Updating');
        matrix.updateGrid();

        if(mouseDown){
            let temp = matrix.traverseMatrix(previouseMouseX, previouseMouseY, mouseX, mouseY);
            
            console.log(temp);
            for( let i=0; i<temp.length; i++){
                matrix.createParticle(temp[i][0], temp[i][1]);
            }
        }
    }

    app.renderer.events = new EventSystem(app.renderer);

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    app.stage.on("mousedown", (event) => {
        previouseMouseX = mouseX;
        previouseMouseY = mouseY;
        
        mouseX = Math.trunc(event.global.x / matrix.getTileSize());
        mouseY = Math.trunc(event.global.y / matrix.getTileSize());
        mouseDown = true;
    
    });

    app.stage.on("mousemove", (event) => {
        previouseMouseX = mouseX;
        previouseMouseY = mouseY;

        mouseX = Math.trunc(event.global.x / matrix.getTileSize());
        mouseY = Math.trunc(event.global.y / matrix.getTileSize());
    });

    app.stage.on("mouseup", (event) => {
        mouseDown = false;
    });

    

})();
