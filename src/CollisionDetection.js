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
import { CreateEnemy } from './CreateEnemy';
import { Player, Sound, FX, Enemy } from './Config';
const Socket = io();

/**
 * Callback function for when Player.bullet hits an enemy
 * 
 * @param {p5.Sprite} other The sprite which is colliding with the bullet sprite
 * @param {p5.Sprite} bullet The Player.bullet sprite
 */
export function CheckCollision(other, bullet) {
    let scale = other.scaleFactor - 1;

    if (scale > 0) {
        CreateEnemy(other.position.x, other.position.y, scale);
        CreateEnemy(other.position.x, other.position.y, scale);
    }

    for (let i = 0; i < 15; i++) {
        let particle = p5.createSprite(bullet.position.x + 2, bullet.position.y + 2);
        particle.addImage(p5.loadImage(Enemy.explosion));
        particle.setSpeed(p5.random(3, 5), p5.random(360));
        particle.rotation = 1000 * p5.cos(p5.radians(p5.random(360)));
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
export function PlayerCollision(player, enemy) {
    let lives = Player.lives.value;
    let playerExplosion = p5.createSprite(player.position.x + 2, player.position.y + 2);
    for (let i = 0; i < 3; i++) {
        playerExplosion.addAnimation('small', Player.explosion[0]);
        playerExplosion.addAnimation('large', Player.explosion[1]);

        playerExplosion.addImage(p5.loadImage(Player.explosion[0]));
        playerExplosion.setSpeed(p5.random(3, 5), p5.random(360));
        playerExplosion.rotation = 1000 * p5.cos(p5.radians(p5.random(360)));
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
            p5.allSprites.forEach(sprite => {
                sprite.remove();
            });
            FX.gameOver.sprite = p5.createSprite(p5.width / 2, p5.height / 2);
            FX.gameOver.sprite.addImage(FX.gameOver.img);
            FX.gameOver.sprite.scale = 0.4;
            FX.gameOver.sprite.position.x = p5.width / 2;
            FX.gameOver.sprite.position.y = p5.height / 2;
            p5.noLoop();
        }, 200);
        return;
    };
    Player.bullets.forEach((bullet) => {
        bullet.remove();
    });

    Socket.emit('player hit', Player.lives.value);
}
