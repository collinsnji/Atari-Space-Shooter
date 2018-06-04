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
    MARGIN: 0,
    MAX_ENEMY: 2,
    LEVELS: 10,
    PAUSE: false,
    CURRENT_LEVEL: 0,
    GENERATE: true,
    ENEMY_COUNTDOWN: 3000,
    BACK_GROUND: null,
    GENERATE_ENEMY_ID: null,
};

//The Player Object
const Player = {
    ship: null,
    bullets: null,
    score: 0,
    bulletImg: '../assets/bullet.png',
    sprite: '../assets/player.png',
    explosion: ['../assets/fx/explosion0.png', '../assets/fx/explosion1.png'],
    lives: {
        value: 3,
        img: '../assets/live.png',
        sprite: []
    }
};

// The Enemy Object
const Enemy = {
    ships: null,
    bullets: null,
    sprite: '../assets/enemy.png',
    bulletImg: '../assets/enemy_fire.png',
    explosion: '../assets/explosion.png',
    created: false
};

const Sound = {
    backgroundSound: null,
    playerShoot: null,
    playerDeath: null,
    enemyDeath: null,
};

const FX = {
    gameOver: {
        sprite: null,
        img: '../assets/game-over.png'
    },
    font: null,
};
/**
 * Create a new Enemy ship
 * @param {Number} x The x-coordinate of the ship. This value is used in placing the ship on the canvas
 * @param {Number} y The y-coordinate of the ship. This value is used in placing the ship on the canvas
 * @param {Number} scaleFactor Value used in calculating the `enemyShip.scale` value
 */
function createEnemy(x, y, scaleFactor) {
    let enemyShip = createSprite(x, y);
    let enemyShipImg = loadImage(Enemy.sprite);
    enemyShip.scale = scaleFactor / 4;
    enemyShip.addImage(enemyShipImg);

    enemyShip.setSpeed(2.5 + random(Player.ship.getSpeed()), random(360));
    enemyShip.scaleFactor = scaleFactor;

    if (scaleFactor == 2) {
        enemyShip.scale = 0.6;
    }
    if (scaleFactor == 1) {
        enemyShip.scale = 0.3;
    }

    enemyShipImg.mass = 2 + enemyShip.scale;
    Enemy.ships.add(enemyShip);
    return enemyShip;
}

/**
 * Create new enemies every config.ENEMY_COUNTDOWN seconds
 * @param {Boolean} state Generation state. Used in determining whether to generate enemies or not
 * @param {Number} intervalID The ID of the interval. This is important for the `pause` feature to work
 * @param {Number} time Timeout value passed into generator
 * @returns An interval if specified | Clear the current interval if `state == false` | Returns false
 */
function GenerateEnemies(state, intervalID, time) {
    if (state) {
        return intervalID = setInterval(() => {
            for (let i = 0; i < config.MAX_ENEMY; i++) {
                let angle = random(360);
                let enemyPos = {
                    x: random(width / 2),
                    y: random(height / 4)
                }
                createEnemy(enemyPos.x, enemyPos.y, 2);
            }

            // let the draw method know that enemies have been created
            Enemy.created = true;
        }, time);
    }
    else {
        return clearInterval(intervalID);
    }
    return false;
}

/**
 * Collision Detection function. Test collision between enemy object and a bullet
 * @param {p5.Sprite} other The Sprite to check collision against
 * @param {p5.Sprite} bullet The bullet fired by the player
 */
function CheckCollision(other, bullet) {
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
        Player.score += 10;

        // send score to server
        Socket.emit('current score', Player.score);
        // if(Player.score > config.MAX_ENEMY){
        //     config.MAX_ENEMY = config.MAX_ENEMY + (Player.score % 10)
        // }
    }

    Sound.enemyDeath.play();
    bullet.remove();
    other.remove();
}

/**
 * Callback function for when player hits an enemy
 * 
 * @param {p5.Sprite} player The player sprite
 * @param {p5.Sprite} enemy Enemy sprite
 */
function destroyPlayer(player, enemy) {
    let lives = Player.lives.value;
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

    // remove one live img from array
    console.log(Player.lives.sprite.length);
    if (Player.lives.sprite.length > 0) {
        Player.lives.sprite.pop().remove();
    }
    enemy.remove();
    Player.lives.value -= 1;

    /**
     * If the player is out of lives, wait 100ms before ending the game loop.
     * This gives the game a more realistic feeling
     */
    if (Player.lives.value <= 0) {
        console.log(`Game Over`);
        // play plater dead sound here

        // Stop background song
        Sound.backgroundSound.stop();

        setTimeout(() => {
            allSprites.forEach(sprite => {
                sprite.remove();
            });
            FX.gameOver.sprite = createSprite(width / 2, height / 2);
            FX.gameOver.sprite.addImage(FX.gameOver.img);
            FX.gameOver.sprite.scale = 0.4;
            FX.gameOver.sprite.position.x = width / 2;
            FX.gameOver.sprite.position.y = height / 2;
            noLoop();
        }, 200);
        return;
    };
    Player.bullets.forEach((bullet) => {
        bullet.remove();
    });

    Socket.emit('player hit', Player.lives.value);
}

/**
 * Preload game assets
 */
function preload() {
    soundFormats('wav', 'mp3');

    // Preload game over image
    FX.gameOver.img = loadImage(FX.gameOver.img);
    Sound.backgroundSound = loadSound('../assets/sounds/deadlocked-f777.mp3');
    Sound.playerShoot = loadSound('../assets/sounds/player-shoot.wav');
    Sound.enemyDeath = loadSound('../assets/sounds/enemy-death.wav');

    // Control sound volumes
    Sound.enemyDeath.setVolume(0.5);
    Sound.playerShoot.setVolume(0.4);

    FX.font = loadFont('../assets/fonts/pixel-font.ttf');
}

/**
 * Event Listeners
 */
function keyPressed() {
    // Pause the background sound if the shift key is pressed
    if (keyCode == SHIFT) {
        if (Sound.backgroundSound.isPlaying()) {
            Sound.backgroundSound.pause();
        } else {
            Sound.backgroundSound.play();
        }
    }
    else return;
}

/**
 * Setup function used by Processing to set up defaults
 */
function setup() {
    // set Canvas size
    let canvas = createCanvas(windowWidth / 2, windowHeight);
    canvas.parent('gameCanvas');

    // hide rhe cursor
    noCursor();

    // Create groups to hold various elements
    config.BACK_GROUND = new Group();
    Player.bullets = new Group();
    Enemy.bullets = new Group();
    Enemy.ships = new Group();

    // Create player sprite
    Player.ship = createSprite(10, 10);
    Player.ship.addImage(loadImage(Player.sprite));

    // Player live setup
    for (let i = 0; i < Player.lives.value; i++) {
        Player.lives.sprite[i] = createSprite(5, 5);
        Player.lives.sprite[i].addImage(loadImage(Player.lives.img));
    }


    // Create Enemies 
    GenerateEnemies(config.GENERATE, config.GENERATE_ENEMY_ID, config.ENEMY_COUNTDOWN);

    //create some background for visual reference
    for (let i = 0; i < 10; i++) {
        //create a sprite and add the 3 animations
        let planets = createSprite(random(width), random(height));
        let stars = createSprite(random(width), random(height));
        //cycles through rocks 0 1 2
        planets.addAnimation('normal', '../assets/space/far-planets.png');
        stars.addAnimation('normal', '../assets/space/stars.png');
        config.BACK_GROUND.add(planets);
        config.BACK_GROUND.add(stars);
    }
    config.BACK_GROUND.forEach((backgroundImg) => {
        backgroundImg.setSpeed(backgroundImg.mass * 3.5, 90);
    });

    // trigger background sound
    setTimeout(() => {
        Sound.backgroundSound.play();
    }, 3000);
}

/**
 * Processing `draw()` function
 */

function draw() {
    /**
     * Scroll background infinitely
     * If the stars or planet's position is greater than the canvas size reset its position
     */
    background(10);
    config.BACK_GROUND.forEach(backgroundItem => {
        backgroundItem.position.y += backgroundItem.width * 0.01;
        if (backgroundItem.position.y > height) {
            backgroundItem.position.y = 0;
        }

    });

    // Show lives
    for (let i = 0; i < Player.lives.sprite.length; i++) {
        Player.lives.sprite[i].scale = 0.1;
        Player.lives.sprite[i].position.x = (width - 100) - (i * 50);
        Player.lives.sprite[i].position.y = 20;
    }
    /**
     * Set player position and size
     */
    Player.ship.position.x = mouseX;
    Player.ship.position.y = mouseY
    Player.ship.scale = 0.3;

    /**
     * CAMERA SETUP
     * Set the camera position to the player position
     * If the mouse is pressed, change the zoom value of the camera
     */
    camera.zoom = (mouseIsPressed) ? 1 : 0.7;

    camera.position.x = Player.ship.position.x;
    camera.position.y = Player.ship.position.y;
    camera.off();

    /**
     * Constrain player to the configured scene size
     */
    if (Player.ship.position.x < 0) {
        Player.ship.position.x = 0;
    }
    if (Player.ship.position.y < 0) {
        Player.ship.position.y = 0;
    }
    if (Player.ship.position.x > width) {
        Player.ship.position.x = width;
    }
    if (Player.ship.position.y > height) {
        Player.ship.position.y = height;
    }

    /**
     * Obsolete comment: constrain all sprites with a 40px margin of the canvas
     * TODO: Make this freaking work  properly
     */
    Enemy.ships.forEach(sprite => {
        if (sprite.position.x <= 0 || sprite.position.x >= width) sprite.velocity.x *= -1;
        // if (sprite.position.x > width + config.MARGIN) sprite.position.x = -config.MARGIN;
        if (sprite.position.y <= 0 || sprite.position.y >= height) sprite.velocity.y *= -1;
        // if (sprite.position.y > height + config.MARGIN) sprite.position.y = height / (height - 100);
        // if (sprite.position.y > height + config.MARGIN) sprite.getDirection() = height / (height - 100);
    });

    /**
     * Check collision between bullets and enemy ships
     * Also check collision between player ship and enemy
     */
    Enemy.ships.collide(Player.bullets, CheckCollision);
    Player.ship.collide(Enemy.ships, destroyPlayer);

    /**
     * Remove a bullet if it goes beyond the visible canvas
     */
    Player.bullets.forEach((bullet) => {
        if (bullet.position.y < 1) {
            bullet.remove();
        }
    });

    // HACK: fire the bullets if space key is pressed
    // TODO: Use a mousePressed function instead to test if user is shooting
    if (keyWentDown('space')) {
        let bullet = createSprite(Player.ship.position.x, Player.ship.position.y);
        bullet.addImage(loadImage(Player.bulletImg));
        bullet.setSpeed(10, 270);
        bullet.life = 100;
        Sound.playerShoot.play();
        Player.bullets.add(bullet);
    }

    /**
     * TODO: Make this work properly.
     */
    if (Player.score > 0 && Player.score % 100 === 0) {
        console.log(`Level ${config.CURRENT_LEVEL} completed`);
        config.ENEMY_COUNTDOWN -= Player.score;

        // config.CURRENT_LEVEL += 1;
        // config.MAX_ENEMY += 1;
    }


    // Stop Creating Enemies if there are up to 50 on the screen
    if (Enemy.ships.length >= 50) {
        GenerateEnemies(false, config.GENERATE_ENEMY_ID);
    }

    /**
     * Pause Game when `P` key is pressed
     */
    if (keyCode == 80 && config.PAUSE == false) {
        GenerateEnemies(false, config.GENERATE_ENEMY_ID);
        config.PAUSE == true;
        config.GENERATE = false;
    }
    else if (keyCode == 80 && config.PAUSE == true) {
        GenerateEnemies(config.PAUSE, config.GENERATE_ENEMY_ID);
        config.PAUSE == false;
    }

    // Show user Score
    fill(255).textSize(22);
    textFont(FX.font);
    text(`Score: ${Player.score}`, width - 200, 60);
    // draw all sprites on the screen
    drawSprites();
}
