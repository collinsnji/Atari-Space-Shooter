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

'use strict';

// configs
const FADE_TIME = 150; // ms
const TYPING_TIMER_LENGTH = 400; // ms
const COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

const socket = io();
const Window = window;
const Elements = {
    usernameInput: document.querySelector('.usernameInput'),
    messages: document.querySelector('.messages'),
    inputMessage: document.querySelector('.inputMessage'),
    messageList: document.querySelector('#message-list'),
    // pages
    loginPage: document.querySelector('.login-ui'),
    chatPage: document.querySelector('.chat.page'),
    // scoreboard
    scoreboard: document.querySelector('.scoreboard'),
}

const Client = {
    username: null,
    connected: false,
    typing: false,
    lastTypingTime: null
}

class AtariChat {
    AddParticipant(data) {
        let message = '';
        if (data.numUsers === 1) {
            message += "There's 1 participant";
        } else {
            message += "There are " + data.numUsers + " participants";
        }
        console.log(message);
    }
    SetUserName() {
        Client.username = Helpers.cleanInput(Elements.usernameInput.value);

        // If the username is valid
        if (Client.username) {
            Helpers.fadeOut(Elements.loginPage, FADE_TIME);
            Elements.loginPage.style.display = 'none';

            // Tell the server your username
            console.log(Client.username);
            socket.emit('add user', Client.username);
        }
    }
    SendMessage() {
        let message = Elements.inputMessage.value;
        // Prevent markup from being injected into the message
        message = Helpers.cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && Client.connected) {
            Elements.inputMessage.value = '';
            this.AddChatMessage({
                username: Client.username,
                message: message
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', message);
        }
    }
    AddChatMessage(data, options) {
        let typingMessages = Helpers.getTypingMessages(data) || [];
        options = options || {};
        options.currentUser = data.username;

        if (typingMessages.length !== 0) {
            options.fade = false;
            Helpers.fadeOut(typingMessages, FADE_TIME);
        }

        let usernameDiv = Helpers.createElement('span', {
            class: 'username',
            style: `color: ${Helpers.getUsernameColor(data.username)}`,
            text: data.username
        });

        let messageBodyDiv = Helpers.createElement('span', {
            class: 'messageBody',
            text: data.message,
        });

        let typingClass = data.typing ? 'typing' : '';
        let messageContainer = Helpers.createElement('div', {
            class: 'messageContainer',
        });
        let message = Helpers.createElement('li', {
            class: 'message',
            'data-username': data.username,
            style: 'display: flex'
        });
        Helpers.append(message, [Helpers.append(messageContainer, [usernameDiv, messageBodyDiv])]);
        this.AddMessageElement(message, options);
    }
    AddMessageElement(el, options) {
        // Setup default options
        options = (!options ? {} : options);
        if (typeof options.fade === 'undefined') { options.fade = true; }
        if (typeof options.prepend === 'undefined') { options.prepend = false; }
        if (typeof options.currentUser === 'undefined') {
            options.currentUser = Client.username || socket.username;
        }

        // Apply options
        if (options.fade && options.isTyping) {
            Helpers.fadeOut(el, FADE_TIME);
        }
        if (options.prepend) {
            Elements.messages.prepend(el);
        } else {
            Elements.messages.appendChild(el);
        }
        if (options.currentUser == Client.username) {
            el.style.cssText = 'display: flex; flex-direction: row-reverse';
        }
        else {
            el.children[0].children[0].style.alignSelf = 'flex-start';
        }
        // Elements.messages[0].scrollTop = Elements.messages[0].scrollHeight;
    }
    UpdateTyping() {
        if (Client.connected) {
            if (!Client.typing) {
                Client.typing = true;
                socket.emit('typing');
            }
            Client.lastTypingTime = (new Date()).getTime();

            setTimeout(() => {
                let typingTimer = (new Date()).getTime();
                let timeDiff = typingTimer - Client.lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && Client.typing) {
                    socket.emit('stop typing');
                    Client.typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }
    AddChatTyping(data) {
        data.typing = true;
        data.message = 'is typing';
        return true;
    }
    RemoveChatTyping(data) {
        // TODO: Make this function work properly
        // Helpers.fadeOut(Helpers.getTypingMessages(data), FADE_TIME);
        return;
    }
    Observer(watchElement) {
        let config = { attributes: true, childList: true };

        let callback = (mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type == 'childList') {
                    watchElement.scrollTop = watchElement.scrollHeight;
                }
                else if (mutation.type == 'attributes') {
                    console.log(`${mutation.attributeName} -> modified`);
                }
            }
        };

        let observer = new MutationObserver(callback);
        return observer.observe(watchElement, config);
    }
}

const Helpers = {
    append: (parent, children) => {
        if (typeof children === 'object') {
            for (let i = 0; i < children.length; i++) {
                parent.appendChild(children[i]);
            };
            return parent;
        }
        if (typeof children === 'string') {
            return parent.appendChild(children);
        }
    },
    createElement: (element, options) => {
        let el = document.createElement(element);
        for (let i in options) {
            if (i.toString() == 'text') {
                el.innerText = options[i];
            } else {
                el.setAttribute(i, options[i]);
            }
        }
        return el;
    },
    fadeOut: (el, duration) => {
        let fadeTarget = el;
        let fadeEffect = setInterval(() => {
            if (!fadeTarget.style.opacity) {
                fadeTarget.style.opacity = 1;
            }
            if (fadeTarget.style.opacity < 0.1) {
                clearInterval(fadeEffect);
            } else {
                fadeTarget.style.opacity -= 0.1;
            }
        }, duration);
        el.parentNode.removeChild(el);
    },
    fadeIn: (el, duration) => {
        let fadeTarget = el;
        let fadeEffect = setInterval(() => {
            if (!fadeTarget.style.opacity) {
                fadeTarget.style.opacity = 0;
            }
            if (fadeTarget.style.opacity < 1) {
                clearInterval(fadeEffect);
            } else {
                fadeTarget.style.opacity += 0.1;
            }
        }, duration);
    },
    getTypingMessages: (data) => {
        let typingData = [];
        return document.querySelectorAll('.typing.message').forEach((el) => {
            if (el.getAttribute('data-username') === data.username) {
                console.log(el);
                return el;
            }
            // couldn't find el
            return false;
        });
    },
    getUsernameColor: (username) => {
        let hash = 7;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        let index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    },
    cleanInput: (input) => {
        return input.toString().trim();
    }
}

// Init
let AtariChatClient = new AtariChat();

// Watch for DOM changes on the message list and run updates
AtariChatClient.Observer(Elements.messageList);

// Event listeners
Window.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey || event.metaKey || event.altKey || event.spaceKey)) {
        Elements.usernameInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.keyCode === 13) {
        if (Client.username) {
            AtariChatClient.SendMessage();
            socket.emit('stop typing');
            Client.typing = false;
        } else {
            AtariChatClient.SetUserName();
        }
    }
});

Elements.inputMessage.addEventListener('input', () => {
    AtariChatClient.UpdateTyping();
});
Elements.inputMessage.addEventListener('click', (e) => {
    return true;
})


// Sockets
socket.on('login', (data) => {
    Client.connected = true;
    let message = "Atari World Chat";
    console.log(message);
});

// Whenever the server emits 'new message', update the chat body
socket.on('new message', (data) => {
    AtariChatClient.AddChatMessage(data);
});

// Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', (data) => {
    console.log(data.username + ' joined');
    AtariChatClient.AddParticipant(data);
});

// Whenever the server emits 'user left', log it in the chat body
socket.on('user left', (data) => {
    console.log(data.username + ' left');
    AtariChatClient.AddParticipant(data);
    // console.log(data);
});

// Whenever the server emits 'typing', show the typing message
socket.on('typing', (data) => {
    AtariChatClient.AddChatTyping(data);
});

// Whenever the server emits 'stop typing', kill the typing message
socket.on('stop typing', (data) => {
    AtariChatClient.RemoveChatTyping(data);
    // console.log(data);
});

socket.on('disconnect', () => {
    console.log('you have been disconnected');
});

socket.on('reconnect', () => {
    console.log('you have been reconnected');
    if (Client.username) {
        socket.emit('add user', Client.username);
    }
});

socket.on('reconnect_error', () => {
    console.log('attempt to reconnect has failed');
});

// when server emits a score update
socket.on('score update', (currentScore) => {
    let userId = Client.username.match(/[^_\s\W]+/g).join('-');
    console.log(Elements.scoreboard.childNodes.length);

    if (Elements.scoreboard.childNodes.length > 0) {
        let userScore = document.getElementById(`${userId}-score`);
        userScore.innerHTML = `${currentScore.username}: ${currentScore.score}`
    }
    else {
        let scoreList = Helpers.createElement('ul', {
            class: 'scoreboardList',
            style: 'color: #fff;'
        });
        let userScore = Helpers.createElement('li', {
            class: 'score',
            id: `${userId}-score`,
            text: `${currentScore.username}: ${currentScore.score}`
        });
        console.log(userScore);
        scoreList.appendChild(userScore);
        Elements.scoreboard.appendChild(scoreList);
    }
});
