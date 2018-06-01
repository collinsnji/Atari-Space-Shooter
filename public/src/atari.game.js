'use strict';

/**
 * Atari World Space Shooter
 * 
 * @version 0.0.1
 * @author Collin Grimm <hello@collingrimm.me>
 * @copyright (c) 2018 Collin Grimm
 * @license MIT License https://collingrimm.me/license
 * 
 */


/* Main Socket to connect game to server */
const Socket = io();

/* Global Configs */
const config = {
    MARGIN: 40,
    MAX_ENEMY: 10,
    SCORE: 0,
    // scene is twice the size of the canvas
    SCENE_W: 1200,
    SCENE_H: 1600,
    LEVELS: 10,
    BACK_GROUND: null,
    PAUSE: false
}

/** 
 * The Player Object
 * Player.ship: The player's ship
 * PLayer.bullets: A processing group to hold the player bullets
 * Player.bulletImg: Player bullet sprite
 * Player.sprite: Player's sprite
 * Player.explosion: Explosion used when the player dies
 * 
 */

const Player = {
    ship: null,
    bullets: null,
    bulletImg: '../assets/bullet.png',
    sprite: '../assets/player.png',
    explosion: ['../assets/fx/explosion0.png', '../assets/fx/explosion1.png'],
    lives: 3
}

/** 
 * The Enemy Object
 * Enemy.ship: The enemy's ship
 * Enemy.bullets: A processing group to hold the enemy bullets
 * Enemy.bulletImg: Enemy bullet sprite
 * Enemy.sprite: Enemy sprite
 * Enemy.explosion: Explosion used when the enemy dies
 */
const Enemy = {
    ships: null,
    bullets: null,
    sprite: '../assets/enemy.png',
    bulletImg: '../assets/bullet.png',
    explosion: '../assets/explosion.png',
    created: false
}

function setup() {
    // set Canvas size
    let canvas = createCanvas(windowWidth / 2, windowHeight - 200);
    canvas.parent('gameCanvas');
    background(0);

    // hide rhe cursor
    noCursor();

    //create player sprites
    Player.ship = createSprite(10, 10);
    Player.ship.addImage(loadImage(Player.sprite));
    config.BACK_GROUND = new Group();

    //create some background for visual reference
    for (let i = 0; i < 10; i++) {
        //create a sprite and add the 3 animations
        let planets = createSprite(random(-width, config.SCENE_W + width), random(-height, config.SCENE_H + height));
        let stars = createSprite(random(-width, config.SCENE_W + width), random(-height, config.SCENE_H + height));
        //cycles through rocks 0 1 2
        planets.addAnimation('normal', '../assets/space/far-planets.png');
        stars.addAnimation('normal', '../assets/space/stars.png');
        config.BACK_GROUND.add(planets);
        config.BACK_GROUND.add(stars);
    }

    // create groups to hold bullets and enemy ships
    Player.bullets = new Group();
    Enemy.bullets = new Group();
    Enemy.ships = new Group();

    // create enemies two seconds after game starts
    setTimeout(() => {
        for (let i = 0; i < config.MAX_ENEMY; i++) {
            let angle = random(360);
            let enemyPos = {
                x: (width / 2) + 1000 * cos(radians(angle)),
                y: (height / 2) + 1000 * sin(radians(angle))
            }
            createEnemy(enemyPos.x, enemyPos.y, 3);
        }

        // let the draw method know that enemies have been created
        Enemy.created == true;
    }, 3000);
}

function draw() {
    background(0);

    // set player position and size
    Player.ship.position.x = constrain(mouseX, 0, windowWidth / 2);
    Player.ship.position.y = mouseY;
    Player.ship.scale = 0.3;

    // CAMERA SETUP
    //set the camera position to the player position
    camera.zoom = (mouseIsPressed) ? 0.5 : 1;

    camera.position.x = Player.ship.position.x;
    camera.position.y = Player.ship.position.y;
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
    Enemy.ships.collide(Player.bullets, CheckHit);
    Player.ship.collide(Enemy.ships, destroyPlayer);

    // HACK: fire the bullets if space key is pressed
    // TODO: Use a mousePressed function instead to test if user is shooting
    if (keyWentDown('space')) {
        let bullet = createSprite(Player.ship.position.x, Player.ship.position.y);
        bullet.addImage(loadImage(Player.bulletImg));
        bullet.setSpeed(10 + Player.ship.getSpeed(), 270);
        bullet.life = 40;
        Player.bullets.add(bullet);
    }

    if (Enemy.ships.length <= 0 && Enemy.created == true) {
        console.log("Level Complete");
    }

    // draw all sprites on the screen
    drawSprites();
    if (keyWentDown('p') && config.PAUSE == false) {
        config.PAUSE == true;
        noLoop();
    }
    if (keyWentDown('p') && config.PAUSE == true) {
        config.PAUSE == false;
        loop();
    }
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
        Socket.emit('current score', config.SCORE);
        // if(config.SCORE > config.MAX_ENEMY){
        //     config.MAX_ENEMY = config.MAX_ENEMY + (config.SCORE % 10)
        // }
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
    Enemy.ships.add(enemyShip);

    setInterval(() => {
        if (enemyShip.position.y > Player.ship.position.y) {
            let bullet = createSprite(enemyShip.position.x, enemyShip.position.y);
            bullet.addImage(loadImage(Enemy.bulletImg));
            bullet.setSpeed(5 + enemyShip.getSpeed(), enemyShip.rotation + 90);
            bullet.life = 40;
            Enemy.bullets.add(bullet);
        }

    }, 2000);

    return enemyShip;
}

function destroyPlayer(player, enemy) {
    let lives = Player.lives;
    let playerExplosion = createSprite(player.position.x + 2, player.position.y + 2);
    for (let i = 0; i < 3; i++) {
        playerExplosion.addAnimation('small', Player.explosion[0]);
        playerExplosion.addAnimation('large', Player.explosion[1]);

        playerExplosion.addImage(loadImage(Player.explosion[0]));
        playerExplosion.setSpeed(random(3, 5), random(360));
        playerExplosion.rotation = 1000 * cos(radians(random(360)));
        playerExplosion.friction = 0.95;
        playerExplosion.life = 30;
    }
    playerExplosion.changeAnimation('large');
    console.log('lives', lives);

    enemy.remove();
    Player.lives -= 1;
    if (Player.lives <= 0) {
        console.log('Game Over');
        setTimeout(() => noLoop(), 100);
        return;
    };
    Player.bullets.forEach((bullet) => {
        bullet.remove();
    });

    Socket.emit('player hit', Player.lives);
}