/**
 * Copyright (C) 2018 collingrimm
 * 
 * This file is part of Atari Space Shooter.
 * 
 * Atari Space Shooter is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Atari Space Shooter is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Atari Space Shooter.  If not, see <http://www.gnu.org/licenses/>.
 * 
 */

import p5 from 'p5/lib/p5';
import 'p5/lib/addons/p5.sound';
import 'p5/lib/addons/p5.play';

import './scss/style.scss';
import { Config, Player, Enemy, FX, Sound } from './Config';
import { CheckCollision, PlayerCollision } from './CollisionDetection';
import { GenerateEnemy } from './CreateEnemy';


/**
 * Atari Space Shooter is a 2D game made using the Processing library
 * It is designed and maintained by Collin Grimm. Licensed under the 
 * GPLv3 License. (See copyright notice distributed with this file).
 * 
 * Atari Space Shooter follows a lonely space ship which seeks a new home
 * after it's previous home was destroyed by the Mechasms. He must fight 
 * his way though the rest of them if he want to get to his new home.
 * 
 * Takes in the P5 object and initialises it on the BrowserWindowScope
 * @param {Object} p5 P5 Library
 */
const AtariSpaceShooter = (p5) => {
    window.p5 = p5;
    console.log(p5);

    const windowWidth = p5.windowWidth;
    const windowHeight = p5.windowHeight;

    /**
     * Preload game assets. These include sounds, images and background assets
     */
    p5.preload = () => {
        // Preload game over image
        FX.gameOver.img = p5.loadImage(FX.gameOver.img);
        Sound.backgroundSound = p5.loadSound('../assets/sounds/deadlocked-f777.mp3');
        Sound.playerShoot = p5.loadSound('../assets/sounds/player-shoot.wav');
        Sound.enemyDeath = p5.loadSound('../assets/sounds/enemy-death.wav');

        // Control sound volumes
        Sound.enemyDeath.setVolume(0.5);
        Sound.playerShoot.setVolume(0.4);

        FX.font = p5.loadFont('../assets/fonts/pixel-font.ttf');
    }

    /**
     * Event Listeners
     */
    p5.keyPressed = () => {
        // Pause the background sound if the shift key is pressed
        if (p5.keyCode == p5.SHIFT) {
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
    p5.setup = () => {
        // set Canvas size

        let canvas = p5.createCanvas(windowWidth / 2, windowHeight);
        canvas.parent('gameCanvas');

        // hide rhe cursor
        p5.noCursor();

        // Create groups to hold various elements
        Config.BACK_GROUND = new p5.Group();
        Player.bullets = new p5.Group();
        Enemy.bullets = new p5.Group();
        Enemy.ships = new p5.Group();

        // Create player sprite
        Player.ship = p5.createSprite(10, 10);
        Player.ship.addImage(p5.loadImage(Player.sprite));

        // Player live setup
        for (let i = 0; i < Player.lives.value; i++) {
            Player.lives.sprite[i] = p5.createSprite(5, 5);
            Player.lives.sprite[i].addImage(p5.loadImage(Player.lives.img));
        }


        // Create Enemies 
        GenerateEnemy(Config.GENERATE, Config.GENERATE_ENEMY_ID, Config.ENEMY_COUNTDOWN);

        //create some background for visual reference
        for (let i = 0; i < 10; i++) {
            //create a sprite and add the 3 animations
            let planets = p5.createSprite(p5.random(p5.width), p5.random(p5.height));
            let stars = p5.createSprite(p5.random(p5.width), p5.random(p5.height));
            //cycles through rocks 0 1 2
            planets.addAnimation('normal', '../assets/space/far-planets.png');
            stars.addAnimation('normal', '../assets/space/stars.png');
            Config.BACK_GROUND.add(planets);
            Config.BACK_GROUND.add(stars);
        }
        Config.BACK_GROUND.forEach((backgroundImg) => {
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

    p5.draw = () => {
        /**
         * Scroll background infinitely
         * If the stars or planet's position is greater than the canvas size reset its position
         */
        p5.background(10);
        Config.BACK_GROUND.forEach(backgroundItem => {
            backgroundItem.position.y += backgroundItem.width * 0.01;
            if (backgroundItem.position.y > p5.height) {
                backgroundItem.position.y = 0;
            }

        });

        // Show lives
        for (let i = 0; i < Player.lives.sprite.length; i++) {
            Player.lives.sprite[i].scale = 0.1;
            Player.lives.sprite[i].position.x = (p5.width - 100) - (i * 50);
            Player.lives.sprite[i].position.y = 20;
        }
        /**
         * Set player position and size
         */
        Player.ship.position.x = p5.mouseX;
        Player.ship.position.y = p5.mouseY
        Player.ship.scale = 0.3;

        /**
         * CAMERA SETUP
         * Set the camera position to the player position
         * If the mouse is pressed, change the zoom value of the camera
         */
        p5.camera.zoom = (p5.mouseIsPressed) ? 1 : 0.7;

        p5.camera.position.x = Player.ship.position.x;
        p5.camera.position.y = Player.ship.position.y;
        p5.camera.off();

        /**
         * Constrain player to the configured scene size
         */
        if (Player.ship.position.x < 0) {
            Player.ship.position.x = 0;
        }
        if (Player.ship.position.y < 0) {
            Player.ship.position.y = 0;
        }
        if (Player.ship.position.x > p5.width) {
            Player.ship.position.x = p5.width;
        }
        if (Player.ship.position.y > p5.height) {
            Player.ship.position.y = p5.height;
        }

        /**
         * Obsolete comment: constrain all sprites with a 40px margin of the canvas
         * TODO: Make this freaking work  properly
         */
        Enemy.ships.forEach(sprite => {
            if (sprite.position.x <= 0 || sprite.position.x >= p5.width) sprite.velocity.x *= -1;
            // if (sprite.position.x > width + Config.MARGIN) sprite.position.x = -Config.MARGIN;
            if (sprite.position.y <= 0 || sprite.position.y >= p5.height) sprite.velocity.y *= -1;
            // if (sprite.position.y > height + Config.MARGIN) sprite.position.y = height / (height - 100);
            // if (sprite.position.y > height + Config.MARGIN) sprite.getDirection() = height / (height - 100);
        });

        /**
         * Check collision between bullets and enemy ships
         * Also check collision between player ship and enemy
         */
        Enemy.ships.collide(Player.bullets, CheckCollision);
        Player.ship.collide(Enemy.ships, PlayerCollision);

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
        if (p5.keyWentDown('space')) {
            let bullet = p5.createSprite(Player.ship.position.x, Player.ship.position.y);
            bullet.addImage(p5.loadImage(Player.bulletImg));
            bullet.setSpeed(10, 270);
            bullet.life = 100;
            Sound.playerShoot.play();
            Player.bullets.add(bullet);
        }

        /**
         * TODO: Make this work properly.
         */
        if (Player.score > 0 && Player.score % 100 === 0) {
            console.log(`Level ${Config.CURRENT_LEVEL} completed`);
            Config.ENEMY_COUNTDOWN -= Player.score;

            // Config.CURRENT_LEVEL += 1;
            // Config.MAX_ENEMY += 1;
        }


        // Stop Creating Enemies if there are up to 50 on the screen
        if (Enemy.ships.length >= 50) {
            GenerateEnemy(false, Config.GENERATE_ENEMY_ID);
        }

        /**
         * Pause Game when `P` key is pressed
         */
        if (p5.keyCode == 80 && Config.PAUSE == false) {
            GenerateEnemy(false, Config.GENERATE_ENEMY_ID);
            Config.PAUSE == true;
            Config.GENERATE = false;
        }
        else if (p5.keyCode == 80 && Config.PAUSE == true) {
            GenerateEnemy(Config.PAUSE, Config.GENERATE_ENEMY_ID);
            Config.PAUSE == false;
        }

        // Show user Score
        p5.fill(255).textSize(22);
        p5.textFont(FX.font);
        p5.text(`Score: ${Player.score}`, p5.width - 200, 60);
        // draw all sprites on the screen
        p5.drawSprites();
    }
}

// Run the game
new p5(AtariSpaceShooter);
