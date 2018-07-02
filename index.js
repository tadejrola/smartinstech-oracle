const Web3 = require('web3');
const EthereumTx = require('ethereumjs-tx')
const fetch = require('node-fetch');

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ropsten.infura.io/ws'));

// web3.eth.defaultAccount = web3.eth.accounts[0];
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

// var oracleServiceContract = OracleService.at("0x09826380ce7fd6fe77ec8651cb60c5beb7be972f");

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


let myAddress = "0x9c21daBc470B1d10AFDBd076C24c70E778A3c5B1";
const privateKey = Buffer.from('0441829a504f5e1d4194f7494feb6eb2d5819dc0c3204f9fca573aaa8e2a89df', 'hex')
OracleService.events.API_call({ fromBlock: 0 }, function (err, event) {
}).on('data', (log) => {
    let clientContractAddress = log.returnValues.caller;
    let pathToData = log.returnValues.pathToData;
    fetch(log.returnValues.apiUrl)
        .then((resp) => resp.json())
        .then(function (data) {
            let responseData = Object.byString(data, pathToData);
            var oracleClientContract = new web3.eth.Contract(OracleClientABI, clientContractAddress);
            let encodedABI = oracleClientContract.methods.__callback(responseData).encodeABI();
            web3.eth.getTransactionCount(myAddress).then((data) => {
                let tx = {
                    from: myAddress,
                    nonce: data,
                    gasPrice: web3.utils.toHex(web3.utils.toWei('35', 'gwei')),
                    gasLimit: 2000000,
                    to: clientContractAddress,
                    data: encodedABI
                };
                console.log(tx);
                let transaction = new EthereumTx(tx);
                transaction.sign(privateKey);
                let serializedTx = transaction.serialize().toString('hex');
                web3.eth.sendSignedTransaction('0x' + serializedTx, function (err, res) {
                    console.log(res);
                });
            });

            /*                         let tran = web3.eth.accounts.signTransaction(tx, privateKey).then((res) => {
                                        web3.eth.sendSignedTransaction(res.rawTransaction).on('receipt', console.log);
                                    }); */

        });

})