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

/**
 * Create a new Enemy ship
 * @param {Number} x The x-coordinate of the ship. This value is used in placing the ship on the canvas
 * @param {Number} y The y-coordinate of the ship. This value is used in placing the ship on the canvas
 * @param {Number} scaleFactor Value used in calculating the `enemyShip.scale` value
 */

import { Player, Config, Enemy } from './Config';

export function CreateEnemy(x, y, scaleFactor) {
    let enemyShip = p5.createSprite(x, y);
    let enemyShipImg = p5.loadImage(Enemy.sprite);
    enemyShip.scale = scaleFactor / 4;
    enemyShip.addImage(enemyShipImg);

    enemyShip.setSpeed(2.5 + p5.random(Player.ship.getSpeed()), p5.random(360));
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
export function GenerateEnemy(state, intervalID, time) {
    if (state) {
        return intervalID = setInterval(() => {
            for (let i = 0; i < Config.MAX_ENEMY; i++) {
                let enemyPos = {
                    x: p5.random(p5.width / 2),
                    y: p5.random(p5.height / 4)
                }
                CreateEnemy(enemyPos.x, enemyPos.y, 2);
            }

            // let the draw method know that enemies have been created
            Enemy.created = true;
        }, time);
    }
    else {
        return clearInterval(intervalID);
    }
}
