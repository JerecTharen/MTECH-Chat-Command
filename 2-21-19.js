
const net = require('net');
const event = require('events');
const fs = require('fs');

class MessageController extends event{
    constructor(){
        super();
        this.users = [];
    }
    addUser(name){
        this.users.push(name);
    }
    sendToUsers(user, message){
        for(let i = 0; i < this.users.length; i++){
            if(user !== this.users[i]){
                this.emit(`sendMessage${this.users[i]}`, message);
            }
        }
    }
    removeUser(user){
        for(let i = 0; i < this.users.length; i++){
            if(user === this.users[i]){
                this.users.splice(i, 1);
            }
        }
    }
    checkForUser(user){
        let found = false;
        for(let i = 0; i < this.users.length; i++){
            if(user === this.users[i]){
                found = true;
            }
        }
        return found;
    }
    changeName(oldUser, newUser){
        let doContinue = true;
        for(let i = 0; i < this.users.length; i++){
            if(this.users[i] === newUser){
                doContinue = false;
            }
        }
        if(doContinue){
            for(let x = 0; x < this.users.length; x++){
                if(this.users[x] === oldUser){
                    this.users[x] = newUser;
                }
            }
        }
        return doContinue;
    }
    kickUser(user){
        user = user.trim();
        // console.log(`Searching for ${user}`);
        let found = false;
        for(let i = 0; i < theController.users.length; i++){
            if(theController.users[i] === user){
                // console.log('found user');
                found = true;
                this.emit(`kick${user}`);
                this.removeUser(user);
                logging.write(`${user} has been kicked!`);
            }
        }
        return found;
    }
    userList(){
        let result = '';
        for(let i = 0; i < this.users.length; i++){
            result += `${this.users[i]}, `;
        }
        return result;
    }
}

let password = 'password';

let numConnect = 0;

let theController = new MessageController();

let logging = fs.createWriteStream('./chatLog.txt', 'utf8');

logging.on('writeStuff', (chatMessage)=>{
    console.log(chatMessage);
    logging.write(chatMessage);
});

let server = net.createServer(socket =>{

    numConnect++;
    let name = `Client${numConnect}`;
    theController.addUser(name);
    logging.emit('writeStuff', `There are ${numConnect} clients connected`);
    socket.write(`Welcome ${name}!`);
    logging.emit('writeStuff', theController.userList());
    theController.sendToUsers(name, theController.userList());
    theController.sendToUsers(name, `${name} has connected`);
    logging.emit('writeStuff', `${name} has connected`);
    socket.on('data', (data)=>{
        if(data.toString().slice(0,2) === '/w'){
            console.log('entering if statement');
            data = data.toString();
            logging.emit('writeStuff', data);
            let split = data.split(' ');
            let result = '';
            if(theController.checkForUser(split[1])){
                let sendName = split[1];
                split[1] = split[1] + ':';
                for(let i = 1; i < split.length; i++){
                    result += split[i] + ' ';
                }
                result = `${name} whispers: ${result}`;
                logging.emit('writeStuff', `${result} to-${sendName}`);
                theController.emit(`sendMessage${sendName}`, result);
            }
            else if(!data.toString().split(' ')[2]){
                logging.emit('writeStuff', `${name} did not enter a valid whisper message`);
                socket.write('You did not enter a valid whisper message');
            }
            else{
                logging.emit('writeStuff','The user does not exist');
                socket.write('The user does not exist');
            }
        }
        else if(data.toString().slice(0,9) === '/username'){
            let old = name;
            data = data.toString();
            logging.emit('writeStuff', data);
            name = data.slice(10, data.length);
            console.log(data.split(' ')[1]);
            console.log(Boolean(data.split(' ')[1]));
            if(theController.changeName(old, name) && data.split(' ')[1]){
                theController.sendToUsers(old, `${old} changed their username to ${name}`);
                logging.emit('writeStuff', `${old} changed their username to ${name}`);
                socket.write('You changed your username to ' + name);
            }
            else if(theController.changeName(old, name) && !data.split(' '[1])){
                logging.emit('writeStuff', name + ' did not enter a valid username to change to!');
                socket.write('You did not enter a valid username to change to!');
            }
            else{
                socket.write('That name is already taken or is invalid');
                logging.emit('writeStuff', 'That name is already taken or is invalid');
            }
        }
        else if(data.toString().split(' ')[0] === '/kick'){
            data = data.toString();
            logging.emit('writeStuff', data);
            let splits = data.split(' ');
            if(splits[1] === password && splits[2] && splits[2] !== name){
                // console.log('in if statement');
                if(!theController.kickUser(splits[2])){
                    logging.emit('writeStuff', 'That user does not exist');
                    socket.write('That user does nto exist');
                }
            }
            else if(password !== splits[1]){
                socket.write('You entered an incorrect password');
                logging.emit('writeStuff', `${name} entered an incorrect password`);
            }
            else{
                socket.write('That username was not found');
                logging.emit('writeStuff', `${name} entered an incorrect username to kick`);
            }
        }
        else if(data.toString().split(' ')[0] === '/clientlist'){
            logging.emit('writeStuff', theController.userList());
            theController.sendToUsers(name, theController.userList());
        }
        else{
            logging.emit('writeStuff',`${name}: ${data.toString()}`);
            theController.sendToUsers(name,`${name}: ${data.toString()}`);
        }
    });
    theController.on(`sendMessage${name}`, (theMessage)=>{
        socket.write(theMessage);
    });
    theController.on(`kick${name}`, ()=>{
        socket.write('You have been kicked');
        socket.destroy();
    });
    socket.on('error', (err)=>{
        if(err.code === 'ECONNRESET'){
            theController.removeUser(name);
            logging.emit('writeStuff', `${name} Disconnected`);
            theController.sendToUsers(name, `${name} Disconnected`);
        }
        else{
            throw err;
        }
    });
}).listen(5000);

console.log('server up, listening on port 5000');

// server.on('error', (err)=>{
//     if(err === 'ECONNRESET'){
//         console.log('Client Disconnected');
//     }
//     else{
//         throw err;
//     }
// });
