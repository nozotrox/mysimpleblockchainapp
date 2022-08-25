'use-strict'
require('dotenv').config()

const express = require('express')
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')

const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet, } = require('../../test-application/javascript/AppUtil.js');
const cors = require('cors');

const channelName = 'channel2';
const chaincodeName = 'doccert';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


const mainRoute = require('./routes/main')


const app = express();
app.use(cors())
app.use(fileUpload({ createParentPath: true}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/', mainRoute);

//:: Playground


const start = async () => {
    
}

start()

app.listen(process.env.PORT, async () => { 
    
    try {
        
        
		const ccp = buildCCPOrg1();
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
		const wallet = await buildWallet(Wallets, walletPath);
		await enrollAdmin(caClient, wallet, mspOrg1);
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
		const gateway = new Gateway();

        try {
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
            });
        } catch (error) {
            gateway.disconnect();
            console.error(":::::: Could not connect to the blockchain network!\n")
            console.log(err.message);
        }
      

        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);
        app.locals.network = network;
        app.locals.contract = contract;
        app.locals.gateway = gateway;
        app.locals.prettyJSONString = prettyJSONString;
        
        
        console.log("\n:::::: Connection to Blockchain(Hyperledger Fabric) Network established!")
        console.log(`::::: App running at http://localhost:${process.env.PORT}`);

      
    } catch (error) {
        console.log(":::::: Could not start server");
        console.log(error.message);
    }
    
})

