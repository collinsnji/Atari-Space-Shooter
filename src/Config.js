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

export const Config = {
    MARGIN: 0,
    MAX_ENEMY: 2,
    LEVELS: 10,
    PAUSE: false,
    CURRENT_LEVEL: 0,
    ENEMY_COUNTDOWN: 300,
    BACK_GROUND: null,
    GAME_INIT: false,
    BACK_GROUND_SPEED: 3.5,
};

//The Player Object
export const Player = {
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
export const Enemy = {
    ships: null,
    bullets: null,
    sprite: '../assets/enemy.png',
    bulletImg: '../assets/enemy_fire.png',
    explosion: '../assets/explosion.png',
    created: false
};

export const FX = {
    gameOver: {
        sprite: null,
        img: '../assets/game-over.png'
    },
    soundOn: {
        sprite: null,
        img: '../assets/fx/sound.png'
    },
    font: null,
};
