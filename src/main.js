
import Matrix from './matrix.js' ;

import { Sand, Dirt, Stone, Water, Ash, Bedrock, Obsidian, Ice, Wood, Tnt, Steam, Fire } from "./particles/particles.js";

const { Application, EventSystem, Text, Container, Graphics } = PIXI;

let maxWidth = 1500;
let maxHeight = 700;

let mouseDown = false;
let mouseX = null;
let mouseY = null;

let previouseMouseX = null;
let previouseMouseY = null;

let selectedParticle = Sand;

let selectedMenu = "solidsMenu";

let allMenuButtons = null;
let allParticleButtons = null;

let mouseOver = false;

let paused = false;

(async () => {
    console.log( navigator.userAgent );
    const app = new Application();
    await app.init({
        view: document.querySelector("#pixi"),
        // set height and width only if window is smaller than max sizes
        width: window.innerWidth < maxWidth ? window.innerWidth : maxWidth,
        height: window.innerHeight < maxHeight ? window.innerHeight : maxHeight,
        //resizeTo: document.getElementById("pixi-wrapper")
    });

    document.querySelector("#pixi-wrapper").appendChild(app.canvas);

    const containers = {
        playArea: new Container(),
        menu: new Container(),
        ui: new Container(),
    };

    containers.menu.x = 0;
    containers.menu.y = app.screen.height - 200;

    addToStage(containers.playArea, containers.menu, containers.ui);

    // set background color and size of container
    containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height - 200).fill(0x555555));
    containers.menu.addChild(new Graphics().rect(0, 0, app.screen.width, 300).fill(0x333333))


    

    let matrix = new Matrix(app, containers)

  


    app.ticker.add(gameLoop);

    function gameLoop(){

        if( !paused ){
            matrix.updateGrid();
        }
        

        if(mouseDown){
            matrix.traverseMatrixAndCreate(previouseMouseX, previouseMouseY, mouseX, mouseY, selectedParticle);
        }
    }

    const outline = new Graphics().rect(0,0, matrix.getTileSize(), matrix.getTileSize()).stroke({ width: 1, color: 0xff0000 });
    containers.ui.addChild(outline);

    createMenu();

    // Mouse and keyboard inputs
    app.renderer.events = new EventSystem(app.renderer);
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    app.stage.on("pointerover", (event) => {
        mouseOver = true;
    });
    
    app.stage.on("pointerout", (event) => {
        mouseOver = false;
    });

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

        outline.position.set(mouseX * matrix.getTileSize(), mouseY * matrix.getTileSize());
    });

    app.stage.on("pointerup", (event) => {
        mouseDown = false;
    });

    app.stage.on('wheel', (event) => {
        matrix.createParticle(mouseX, mouseY, selectedParticle);
    });

    window.addEventListener('keydown', (event) => {
        if(mouseOver){
            console.log(event.key); 
            if(event.key == ' '){ paused = !paused; }
        }
        
    });

    function addToStage(){
        for(let i = 0; i < arguments.length; i++){
            let child = arguments[i];
            if(child && child.emit){
                app.stage.addChild(arguments[i]);
            }
            else{
                console.error('Invalid Child: ', child);
            }
            
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
    
    function createButton(label, width = 125, height = 40, bg = 0x999999, outline = true, outlineColor = 0xffffff, outlineThicknes = 2, txtColor = 0xffffff){
        const container = new Container();

        const button = new Graphics()
            .rect(0, 0, width, height, 10)
            .fill(bg)
            .stroke({
                width: outlineThicknes,
                color: outlineColor,
            });

        container.addChild(button);

        let text = new Text(label, {
            fontSize: 20,
            fill: txtColor,
        })

        text.anchor.set(0.5);
        text.position.set(width / 2, height / 2);

        container.addChild(text);

        container.cursor = 'pointer';
        container.eventMode = 'static';

        container.on('pointerover', () => { button.clear().rect(0, 0, width, height, 10).fill(0x666666).stroke({ width: outlineThicknes, color: 0x000000}); text = new Text(label, { fontSize: 20, fill: 0x000000}) });
        container.on('pointerout', () => {  button.clear().rect(0, 0, width, height, 10).fill(bg).stroke({ width: outlineThicknes, color: 0xffffff}); text = new Text(label, { fontSize: 20, fill: 0xffffff}) });

        return container;
    }

    function createMenu(){
        let buttonY = 100;
        let buttonIndent = 50;
        let buttonSpacing = 127;
        


        createButtons(buttonY, buttonSpacing, buttonIndent);

        //allButtons["staticSolidsButtons"]["stoneBtn"].visible = false;
    }

    function createButtons(buttonY, buttonSpacing, buttonIndent){

        allMenuButtons = {
            menuSelectButtons: {
                solidsSelect: createButton("Solids", 150, 45).on('pointerdown', () => { selectedMenu = "solidsMenu"; updateMenu(); }),
                liquidsSelect: createButton("Liquids", 150, 45).on('pointerdown', () => { selectedMenu = "liquidsMenu"; updateMenu(); }),
                gasesSelect: createButton("Gases", 150, 45).on('pointerdown', () => { selectedMenu = "gasesMenu"; updateMenu(); }),
                miscSelect: createButton("Misc", 150, 45).on('pointerdown', () => { selectedMenu = "miscMenu"; updateMenu(); }),
                
            }
        };

        allParticleButtons = {
            solidsMenu: {
                stoneBtn: createButton("Stone").on('pointerdown', () => { selectedParticle = Stone; }),
                sandBtn: createButton("Sand").on('pointerdown', () => { selectedParticle = Sand; }),
                dirtBtn: createButton("Dirt").on('pointerdown', () => { selectedParticle = Dirt; }),
                ashBtn: createButton("Ash").on('pointerdown', () => { selectedParticle = Ash }),
                bedrockBtn: createButton("Bedrock").on('pointerdown', () => { selectedParticle = Bedrock }),
                iceBtn: createButton("Ice").on('pointerdown', () => { selectedParticle = Ice }),
                obsidianBtn: createButton("Obsidian").on('pointerdown', () => { selectedParticle = Obsidian }),
                tntBtn: createButton("Tnt").on('pointerdown', () => { selectedParticle = Tnt }),
                woodBtn: createButton("Wood").on('pointerdown', () => { selectedParticle = Wood }),
            },
            liquidsMenu: {
                waterBtn: createButton("Water").on('pointerdown', () => { selectedParticle = Water }),
            },
            gasesMenu: {
                steamBtn: createButton("Steam").on('pointerdown', () => { selectedParticle = Steam }),
                fireBtn: createButton("Fire").on('pointerdown', () => { selectedParticle = Fire }),
            },
            miscMenu: {
                eraserBtn: createButton("Eraser").on('pointerdown', () => { selectedParticle = null }),
            },
        };

        
        for(let btns in allParticleButtons){

            let menu = btns;
            btns = allParticleButtons[btns];
            let i = 0;

            for(let btn in btns){

                let btnPos = buttonSpacing*i + buttonIndent;
                let row = 1;

                if(btnPos + btns[btn].width >= app.screen.width){
                    i = 0;
                    row++;

                    buttonY = (buttonY * row) + buttonIndent/2;
                    btnPos = buttonSpacing*i + buttonIndent;
                }
                
                if(i == 0){ btns[btn].position.set(buttonIndent, buttonY); }
                else{
                    btns[btn].position.set(btnPos, buttonY);
                }

                containers.menu.addChild(btns[btn]);
        
                btns[btn].visible = selectedMenu === menu;

                i++;
            }
            
        }

        let menuY = buttonY / 2;
        buttonSpacing = 152

        for(let btns in allMenuButtons){

            btns = allMenuButtons[btns];
            let i = 0;

            for(let btn in btns){

                let btnPos = buttonSpacing*i + buttonIndent;
                let row = 0;

                if(btnPos + btns[btn].width >= app.screen.width){
                    i = 0;
                    row++;

                    buttonY = (buttonY * row) + buttonIndent/2;
                    btnPos = buttonSpacing*i + buttonIndent;
                }
                
               
                btns[btn].position.set(btnPos, menuY);
                

                containers.menu.addChild(btns[btn]);

                i++;
            }
        }

        return allParticleButtons;

    }

    function updateMenu(){
        for(let menu in allParticleButtons){
            let btns = allParticleButtons[menu];

            for(let btn in btns){
                
                btns[btn].visible = (selectedMenu === menu);

            }

        }
    }

    /*window.addEventListener('resize', () => {
        console.log('Resized!');

        let newWidth = window.innerWidth < maxWidth ? window.innerWidth : maxWidth;
        let newHegiht = window.innerHeight < maxHeight ? window.innerHeight : maxHeight;

        app.renderer.resize( newWidth, newHegiht);

        containers.playArea.width = newWidth;
        matrix = new Matrix(app, containers)
        containers.menu.width = newWidth;

    })*/

    /*window.onload = function () {
        if( detectMob() ) {
            console.log("Mobile");
            containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height - 200).fill(0xffffff)); 
            document.getElementById("pixi-wrapper").style.marginTop = "0px";
        }

    }*/

    /*function detectMob() {
        const toMatch = [
            /Android/i,
            /webOS/i,
            /iPhone/i,
            /iPad/i,
            /iPod/i,
            /BlackBerry/i,
            /Windows Phone/i
        ];

        return toMatch.some((toMatchItem) => {
            return navigator.userAgent.match(toMatchItem);
        });
    }

    // Disable scrolling when hovering over canvas for everything but mobile users
    const elem = document.getElementById('pixi-wrapper');

    elem.addEventListener('mouseover', () => {
        if( ! detectMob() ){
            document.body.style.overflow = 'hidden';
            
        }else { }
    });

    elem.addEventListener('mouseout', () => {
        if( ! detectMob() ){ document.body.style.overflow = ''; } // Resets to default (e.g., auto or initial)
    });*/

    const elem = document.getElementById('pixi');

    elem.addEventListener('mouseover', () => {
        document.body.style.overflow = 'hidden';
    });

    elem.addEventListener('mouseout', () => {
        document.body.style.overflow = '';  // Resets to default (e.g., auto or initial)
    })

})();

