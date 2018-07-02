const Web3 = require('web3');
const EthereumTx = require('ethereumjs-tx')
const fetch = require('node-fetch');
const http = require('http');

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ropsten.infura.io/ws'));
console.log(web3.version);

var OracleService = new web3.eth.Contract([
    {
        "constant": false,
        "inputs": [
            {
                "name": "_apiUrl",
                "type": "string"
            },
            {
                "name": "_pathToData",
                "type": "string"
            },
            {
                "name": "_sender",
                "type": "address"
            }
        ],
        "name": "api_call",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "name": "apiUrl",
                "type": "string"
            },
            {
                "indexed": false,
                "name": "pathToData",
                "type": "string"
            },
            {
                "indexed": false,
                "name": "caller",
                "type": "address"
            }
        ],
        "name": "API_call",
        "type": "event"
    }
], "0x09826380ce7fd6fe77ec8651cb60c5beb7be972f");

var OracleClientABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_data",
                "type": "string"
            }
        ],
        "name": "__callback",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

Object.byString = function (o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1');
    s = s.replace(/^\./, '');
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

let myAddress1 = "0x9c21daBc470B1d10AFDBd076C24c70E778A3c5B1";
const privateKey1 = '0441829a504f5e1d4194f7494feb6eb2d5819dc0c3204f9fca573aaa8e2a89df';

let myAddress2 = "0x25De25639d74879A537405aD2cF757b91eDC6F61";
const privateKey2 = '4d58519b0be75bf864308ee840727354b257ba22891641a92460814fceec95da';

let myAddress3 = "0x4621fB95e5e7515f695963d9D3a7785EEd7a4a63";
const privateKey3 = 'f38df91b012c8af0167e71623266120f3b96a05036e1d964b53b14cf3bba3a49';

let myAddress4 = "0x6620A3Fb0a56b72263300293DC684572acd64b52";
const privateKey4 = '42c30280da6b5db3ce1a70b851faa7e6b4cb6dd95bfe5f59e06eebf706c46023';

let myAddress5 = "0x7d0032A273C2A78D6F47a2f3d8099E8A872132A7";
const privateKey5 = '2d15eb3e420398359bc8c8f13174ff7bf58bb6e4dc542ccbb5daa9097d4f8b7c';

let address1 = {
    address: myAddress1,
    privateKey: privateKey1,
    available: true
}

let address2 = {
    address: myAddress2,
    privateKey: privateKey2,
    available: true
}

let address3 = {
    address: myAddress3,
    privateKey: privateKey3,
    available: true
}

let address4 = {
    address: myAddress4,
    privateKey: privateKey4,
    available: true
}

let address5 = {
    address: myAddress5,
    privateKey: privateKey5,
    available: true
}

var addresses = [];
addresses.push(address1);
addresses.push(address2);
addresses.push(address3);
addresses.push(address4);
addresses.push(address5);

OracleService.events.API_call({ fromBlock: 0 }, function (err, event) {
}).on('data', (log) => {
    let clientContractAddress = log.returnValues.caller;
    let pathToData = log.returnValues.pathToData;
    fetch(log.returnValues.apiUrl)
        .then((resp) => resp.json())
        .then(function (data) {
            var acc = findAvailableAddress();
            index = addresses.findIndex(x => x.address == acc.address);
            addresses[index].available = false;
            signTranscaction(data, acc, clientContractAddress, pathToData);
        });

})

function findAvailableAddress() {
    return addresses.find(x => x.available === true);
}

function signTranscaction(data, address, clientContractAddress, pathToData) {
    let responseData = Object.byString(data, pathToData);
    var oracleClientContract = new web3.eth.Contract(OracleClientABI, clientContractAddress);
    let encodedABI = oracleClientContract.methods.__callback(responseData).encodeABI();
    web3.eth.getTransactionCount(address.address).then((data) => {
        let tx = {
            from: address.address,
            nonce: data,
            gasPrice: web3.utils.toHex(web3.utils.toWei('55', 'gwei')),
            gasLimit: 200000,
            to: clientContractAddress,
            data: encodedABI
        };
        console.log(tx);
        let transaction = new EthereumTx(tx);
        transaction.sign(Buffer.from(address.privateKey, "hex"));
        let serializedTx = transaction.serialize().toString('hex');
        web3.eth.sendSignedTransaction('0x' + serializedTx, function (err, res) {
            if (err) {
                console.log(err);
            }
            else {
                console.log(res);
            }

        }).on("receipt", (receipt) => {
            index = addresses.findIndex(x => x.address == address.address);
            addresses[index].available = true;
            console.log(receipt);
        });
    });
}
http.createServer(function (req, res) {

}).listen(process.env.port || 3000);

