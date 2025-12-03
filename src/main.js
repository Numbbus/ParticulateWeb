import { Application, EventSystem, Text, Container, Graphics } from "pixi.js";
import { FancyButton } from '@pixi/ui';
import Matrix from './matrix.js' ;

import { Sand } from "./particles/particles.js";

let mouseDown = false;
let mouseX = null;
let mouseY = null;

let previouseMouseX = null;
let previouseMouseY = null;

let selectedParticle = Sand;

(async () => {
    const app = new Application();
    await app.init({
        width: 1800,
        height: 800,
    });
    document.body.appendChild(app.canvas);

    const containers = {
        playArea: new Container(),
        menu: new Container(),
    };

    containers.menu.x = 0;
    containers.menu.y = app.screen.height - 300;

    addToStage(containers.playArea, containers.menu);

    // set background color and size of container
    containers.playArea.addChild(new Graphics().rect(0, 0, 1800, 500).fill(0x555555));
    containers.menu.addChild(new Graphics().rect(0, 0, 1800, 300).fill(0x333333))


    const button = createButton('Click Me!');
    button.position.set(50, 50);
    containers.menu.addChild(button);

    button.on('pointerdown', () => { console.log("Clicked!");});







    const matrix = new Matrix(app, containers)

    app.ticker.add(gameLoop);

    function gameLoop(){
        matrix.updateGrid();

        if(mouseDown){
            let temp = matrix.traverseMatrix(previouseMouseX, previouseMouseY, mouseX, mouseY);

            for( let i=0; i<temp.length; i++){
                matrix.createParticle(temp[i][0], temp[i][1], selectedParticle);
            }
        }
    }

    // Mouse and keyboard inputs
    app.renderer.events = new EventSystem(app.renderer);
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    app.stage.on("pointerdown", (event) => {
        previouseMouseX = mouseX;
        previouseMouseY = mouseY;

        mouseX = Math.trunc(event.global.x / matrix.getTileSize());
        mouseY = Math.trunc(event.global.y / matrix.getTileSize());
        mouseDown = true;
    
    });

    app.stage.on("pointermove", (event) => {
        previouseMouseX = mouseX;
        previouseMouseY = mouseY;

        mouseX = Math.trunc(event.global.x / matrix.getTileSize());
        mouseY = Math.trunc(event.global.y / matrix.getTileSize());
    });

    app.stage.on("pointerup", (event) => {
        mouseDown = false;
    });

    function addToStage(){
        for(let i = 0; i < arguments.length; i++){
            app.stage.addChild(arguments[i]);
        }
    }

    // Create a Text object to display the FPS
    const fpsText = new Text('FPS: 0', {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
    });
    fpsText.x = 10;
    fpsText.y = 10;
    containers.menu.addChild(fpsText);

    // Add a listener to the ticker to update the FPS display
    let updateFps = true;
    app.ticker.add(() => {
        if(updateFps){
            fpsText.text = `FPS: ${app.ticker.FPS.toFixed(0)}`;
            updateFps = false;
        }else{
            updateFps = true;
        }
        
    });
    
    function createButton(label, width = 150, height = 50){
        const container = new Container();

        const button = new Graphics()
            .roundRect(0, 0, width, height, 10)
            .fill(0x4a90e2);

        container.addChild(button);

        const text = new Text(label, {
            fontSize: 20,
            fill: 0xffffff,
        })

        text.anchor.set(0.5);
        text.position.set(width / 2, height / 2);

        container.addChild(text);

        container.cursor = 'pointer';
        container.eventMode = 'static';

        container.on('pointerover', () => (button.scale.set(1.05)));
        container.on('pointerout', () => (button.scale.set(1)));

        return container;
    }

})();
