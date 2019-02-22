
const net = require('net');

let client = net.createConnection({port: 5000}, ()=>{
    console.log('connected to server');
});

client.setEncoding('utf8');
client.on('data', (data)=>{
    console.log(data.toString());
});

process.stdin.on('data', (message)=>{
    if(message.toString().trim() === 'exit'){
        process.exit();
    }
    else{
        client.write(message);
    }
});
