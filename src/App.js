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
 * Filename: App.js
 * Date: 06/14/2018
 * Description: Main App runner. This is where the game is initialised
 */

// Import libraries and configs

import p5 from 'p5/lib/p5';
import 'p5/lib/addons/p5.play';

import './scss/style.scss';
import { Config, Player, Enemy, FX } from './Config';
import { CheckCollision, PlayerCollision } from './CollisionDetection';
import { CreateEnemy } from './CreateEnemy';

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

    const windowWidth = p5.windowWidth;
    const windowHeight = p5.windowHeight;
    const socket = io();
    let username = null;
    let enemyTimer = 0;
    socket.on('score update', (data) => { username = (data.username) });
    /**
     * Preload game assets. These include images and background assets
     */
    p5.preload = () => {
        // Preload game over image
        FX.gameOver.img = p5.loadImage(FX.gameOver.img);
        FX.font = p5.loadFont('../assets/fonts/pixel-font.ttf');
    }

    /**
     * Begin game when mouse is clicked
     */
    p5.mousePressed = () => {
        Config.GAME_INIT = true;
    }

    /**
     * Setup function used by Processing to set up defaults
     */
    p5.setup = () => {
        // set Canvas size

        let canvas = p5.createCanvas(windowWidth / 2, windowHeight);
        canvas.parent('gameCanvas');

        p5.setFrameRate(30);

        // Create groups to hold various elements
        Player.bullets = new p5.Group();
        Enemy.bullets = new p5.Group();
        Enemy.ships = new p5.Group();
        Config.BACK_GROUND = new p5.Group();

        // Create player sprite
        Player.ship = p5.createSprite(10, 10);
        Player.ship.addImage(p5.loadImage(Player.sprite));

        // Player live setup
        for (let i = 0; i < Player.lives.value; i++) {
            Player.lives.sprite[i] = p5.createSprite(5, 5);
            Player.lives.sprite[i].addImage(p5.loadImage(Player.lives.img));
        }

        // Create some background elements for visual reference
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
    }

    /**
     * Processing `draw()` function
     */

    p5.draw = () => {
        p5.background(10);
        /**
         * Scroll background infinitely
         * If the stars or planet's position is greater than the canvas size reset its position
         */
        Config.BACK_GROUND.forEach(backgroundItem => {
            if (Config.PAUSE) {
                backgroundItem.setSpeed(0, 90);
                backgroundItem.position.y += backgroundItem.width * 0.01;
            } else {
                backgroundItem.setSpeed(Config.BACK_GROUND_SPEED, 90);
                backgroundItem.position.y += backgroundItem.width * 0.01;
                if (backgroundItem.position.y > p5.height) {
                    backgroundItem.position.y = 0;
                }
            }
        });

        // Run the game if it is initialised by the user
        if (Config.GAME_INIT) {
            // Show player lives on the screen
            for (let i = 0; i < Player.lives.sprite.length; i++) {
                Player.lives.sprite[i].scale = 0.1;
                Player.lives.sprite[i].position.x = (p5.width - 100) - (i * 50);
                Player.lives.sprite[i].position.y = 20;
            }
            /**
             * Set player position and size
             */
            if (!Config.PAUSE) {
                Player.ship.position.x = p5.mouseX;
                Player.ship.position.y = p5.mouseY
                Player.ship.scale = 0.3;
            }

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
             * Constrain all sprites to the available canvas area & generate new enemies
             */
            if (!Config.PAUSE) {
                if (enemyTimer >= Config.ENEMY_COUNTDOWN && Config.MAX_ENEMY <= Config.LEVELS) {
                    enemyTimer = 0;
                    Config.CURRENT_LEVEL += 1;
                    Config.BACK_GROUND_SPEED += 0.5;
                    Config.MAX_ENEMY += 1;
                }

                Enemy.ships.forEach(sprite => {
                    if (sprite.getSpeed() === 0) {
                        sprite.setSpeed(2.5, sprite._angle);
                    }
                    if (sprite.position.x <= 0 || sprite.position.x >= p5.width) sprite.velocity.x *= -1;
                    if (sprite.position.y <= 0 || sprite.position.y >= p5.height) sprite.velocity.y *= -1;
                });
                enemyTimer++;
            } else {
                Enemy.ships.forEach(sprite => {
                    if (sprite.getSpeed() !== 0) {
                        sprite._angle = sprite.getDirection();
                        sprite.setSpeed(0);
                    }
                });
            }

            /**
             * Check collision between bullets and enemy ships
             * Also check collision between player ship and enemy
             */
            if (!Config.PAUSE) {
                Enemy.ships.collide(Player.bullets, CheckCollision);
                Player.ship.collide(Enemy.ships, PlayerCollision);
            }

            /**
             * Remove a bullet if it goes beyond the visible canvas
             */
            Player.bullets.forEach((bullet) => {
                if (Config.PAUSE) {
                    if (bullet.getSpeed() !== 0) bullet.setSpeed(0, 270);
                } else {
                    if (bullet.getSpeed() === 0) bullet.setSpeed(10, 270);
                }

                if (bullet.position.y < 1) {
                    bullet.remove();
                }
            });

            /**
             * Fire a bullet when the user presses the SPACE key
             */
            if (!Config.PAUSE && p5.keyWentDown('space')) {
                let bullet = p5.createSprite(Player.ship.position.x, Player.ship.position.y);
                bullet.addImage(p5.loadImage(Player.bulletImg));
                bullet.setSpeed(10, 270);
                bullet.life = 100;
                Player.bullets.add(bullet);
            }

            // Create Enemies on the screen
            if (!Config.PAUSE && Enemy.ships.length <= Config.MAX_ENEMY) {
                CreateEnemy(p5.random(p5.width / 2), p5.random(p5.width / 2), 2);
            }

            // Show user Score
            p5.fill(255).textSize(22);
            p5.textFont(FX.font);
            p5.text(`Score: ${Player.score}`, p5.width - 200, 60);
            p5.text(`Level: ${Config.CURRENT_LEVEL}`, p5.width - 200, 80);

            // draw all sprites on the screen
            
            p5.drawSprites();

            if (Config.PAUSE) {
                p5.textAlign(p5.CENTER);
                p5.fill(255).textSize(33);
                p5.textFont(FX.font);
                p5.text('Press P to Play', p5.width / 2, p5.height / 2);
            }
        }
        else {
            p5.textAlign(p5.CENTER);
            p5.fill(255).textSize(33);
            p5.textFont(FX.font);
            p5.text('Click to Start', p5.width / 2, p5.height / 2);
            p5.fill(255, 255, 0).textSize(20);
            p5.text(`Press SPACE to shoot \n Press P to pause\n Press SHIFT to Pause music`);
        }
    }

    /**
     * Processing `keyPressed()` function
     */
    p5.keyPressed = () => {
        if (p5.keyCode == 80 && Config.GAME_INIT && Config.PAUSE == false) {
            Config.PAUSE = true;
        }
        else if (p5.keyCode == 80 && Config.GAME_INIT && Config.PAUSE == true) {
            Config.PAUSE = false;
        }
    }
}

// Run the game
new p5(AtariSpaceShooter);
