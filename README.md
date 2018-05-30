
# Atari World Space Shooter

Atari world is an online game made with processing library and runs on Node.js.  
It uses Socket.io for communication between server and front-end. The routing is managed by Node.js Express.   
The scoreboard and other components are written in pure JavaScript. Users can play the game individually,    
but are able to see the hi-score of other players on the scoreboard.

## Running the Code
To install, you need Git, Node.js, Compass, and Yarn

```bash
# Clone the repository from https://github.com/collinsnji/Atari-Space-Shooter
# In your terminal,

git clone https://github.com/collinsnji/Atari-Space-Shooter.git 
cd Atari-Space-Shooter
yarn install
yarn compile-css
yarn start

# visit http://localhost:3000/ to see it live

```
## Features

- Multiple users can join the game and chat room by each entering a unique username
on website load.
- Users can type chat messages to the chat room.
- Users can view each others high score and compete for the highest score