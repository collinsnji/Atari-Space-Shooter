'use strict';

let socket = io();
const config = {
    MARGIN: 40,
    MAX_ENEMY: 8,
    SCORE: 0,
    // scene is twice the size of the canvas
    SCENE_W: 1200,
    SCENE_H: 1600,
    BACK_GROUND: null,
}

const Player = {
    ship: null,
    bullets: null,
    bulletImg: '../assets/bullet.png',
    sprite: '../assets/player.png'
}

const Enemy = {
    ships: null,
    bullet: null,
    sprite: '../assets/enemy.png',
    explosion: '../assets/explosion.png'
}

function setup() {
    // set Canvas size
    let canvas = createCanvas(windowWidth/2, windowHeight);
    canvas.parent('gameCanvas');
    background(0);

    // hide rhe cursor
    noCursor();

    //create player sprites
    Player.ship = createSprite(10, 10);
    Player.ship.addImage(loadImage(Player.sprite));
    config.BACK_GROUND = new Group();

    //create some background for visual reference
    for (let i = 0; i < 80; i++) {
        //create a sprite and add the 3 animations
        let rock = createSprite(random(-width, config.SCENE_W + width), random(-height, config.SCENE_H + height));
        //cycles through rocks 0 1 2
        rock.addAnimation('normal', '../assets/space/stars.png');
        config.BACK_GROUND.add(rock);
    }

    // create groups to hold bullets and enemy ships
    Player.bullets = new Group();
    Enemy.ships = new Group();

    for (let i = 0; i < config.MAX_ENEMY; i++) {
        let angle = random(360);
        let enemyPos = {
            x: (width / 2) + 1000 * cos(radians(angle)),
            y: (height / 2) + 1000 * sin(radians(angle))
        }
        createEnemy(enemyPos.x, enemyPos.y, 3);
    }
}

function draw() {
    background(0);

    // set player position and size
    Player.ship.position.x = constrain(mouseX, 0, windowWidth/2);
    Player.ship.position.y = mouseY;
    Player.ship.scale = 0.3;

    // CAMERA SETUP
    //set the camera position to the player position
    camera.zoom = (mouseIsPressed) ? 0.5 : 1;

    camera.position.x = mouseX;
    camera.position.y = mouseY;
    camera.off();

    // constrain player to the configured scene size
    if (Player.ship.position.x < 0) {
        Player.ship.position.x = 0;
    }
    if (Player.ship.position.y < 0) {
        Player.ship.position.y = 0;
    }
    if (Player.ship.position.x > config.SCENE_W) {
        Player.ship.position.x = config.SCENE_W;
    }
    if (Player.ship.position.y > config.SCENE_H) {
        Player.ship.position.y = config.SCENE_H;
    }

    // constrain all sprites with a 40px margin of the canvas
    allSprites.forEach(sprite => {
        if (sprite.position.x < -config.MARGIN) sprite.position.x = width + config.MARGIN;
        if (sprite.position.x > width + config.MARGIN) sprite.position.x = -config.MARGIN;
        if (sprite.position.y < -config.MARGIN) sprite.position.y = height + config.MARGIN;
        if (sprite.position.y > height + config.MARGIN) sprite.position.y = -config.MARGIN;
    });

    // check collision between bullets and enemy ships
    Enemy.ships.overlap(Player.bullets, CheckHit)
    Player.ship.collide(Enemy.ships);

    // HACK: fire the bullets if space key is pressed
    // TODO: Use a mousePressed function instead to test if user is shooting
    if (keyWentDown('space')) {
        let bullet = createSprite(Player.ship.position.x, Player.ship.position.y);
        bullet.addImage(loadImage(Player.bulletImg));
        bullet.setSpeed(10 + Player.ship.getSpeed(), 270);
        bullet.life = 40;
        Player.bullets.add(bullet);
    }

    if(Enemy.ships.length <= 0){
        console.log("Level Complete");
    }

    // draw all sprites on the screen
    drawSprites();
}

function CheckHit(other, bullet) {
    let scale = other.scaleFactor - 1;

    if (scale > 0) {
        createEnemy(other.position.x, other.position.y, scale);
        createEnemy(other.position.x, other.position.y, scale);
    }

    for (let i = 0; i < 15; i++) {
        let particle = createSprite(bullet.position.x + 2, bullet.position.y + 2);
        particle.addImage(loadImage(Enemy.explosion));
        particle.setSpeed(random(3, 5), random(360));
        particle.rotation = 1000 * cos(radians(random(360)));
        particle.friction = 0.95;
        particle.life = 15;
    }

    if (other.scale <= 0.3) {
        config.SCORE += 10;
        
        // send score to server
        socket.emit('current score', config.SCORE);
        console.log(config.SCORE);
    }
    bullet.remove();
    other.remove();
}

function createEnemy(x, y, scaleFactor) {
    let enemyShip = createSprite(x, y);
    let enemyShipImg = loadImage(Enemy.sprite);
    enemyShip.scale = scaleFactor / 4;
    enemyShip.addImage(enemyShipImg);

    enemyShip.setSpeed(2.5 - (scaleFactor / 2), random(360));
    //a.debug = true;
    enemyShip.scaleFactor = scaleFactor;

    if (scaleFactor == 2) {
        enemyShip.scale = 0.6;
    }
    if (scaleFactor == 1) {
        enemyShip.scale = 0.3;
    }

    enemyShipImg.mass = 2 + enemyShip.scale;
    enemyShip.setCollider("circle", 0, 0, 50);
    Enemy.ships.add(enemyShip);
    return enemyShip;
}