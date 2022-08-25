/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'channel2';
const chaincodeName = 'doccert';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}



/**
 *  A test application to show basic queries operations with any of the asset-transfer-basic chaincodes
 *   -- How to submit a transaction
 *   -- How to query and check the results
 *
 * To see the SDK workings, try setting the logging to show on the console before running
 *        export HFC_LOGGING='{"debug":"console"}'
 */
async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();
		
		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);

			

			// Let's try a query type operation (function).
			// This will be sent to just one peer and the results will be shown.
			
			console.log('\n--> Evaluate Transaction: GetAllDocuments, function returns all the current assets on the ledger');
			let result = await contract.evaluateTransaction('GetAllDocuments');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);


			console.log("\n--> Initial Setup Done!")
			console.log('\n--> Evaluate Transaction: ReadDocument, function returns an asset with a given assetID');
			result = await contract.evaluateTransaction('GetDocumentHistory', '0001');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			// Now let's try to submit a transaction.
			// This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
			// to the orderer to be committed by each of the peer's to the channel ledger.
			/*
			console.log('\n--> Submit Transaction: IssueDocument, creates new asset with ID, color, owner, size, and appraisedValue arguments');
			result = await contract.submitTransaction('IssueDocument', '0001', 'ISCTEM', 'Diploma', 'Backend development certification', 'Satoshi Nakamoto', 'Wed Aug 17 2022', 'haldsjfdowiruflakdflkajf');
			console.log('*** Result: committed');
			if (`${result}` !== '') {
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			}

			console.log('\n--> Evaluate Transaction: ReadDocument, function returns an asset with a given assetID');
			result = await contract.evaluateTransaction('ReadDocument', '0001');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Evaluate Transaction: DocumentExists, function returns "true" if an asset with given assetID exist');
			result = await contract.evaluateTransaction('DocumentExists', '0001');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			console.log('\n--> Submit Transaction: UpdateDocument 0011, change the appraisedValue to 350');
			await contract.submitTransaction('UpdateDocument', '0001', 'ISCTEM', 'Certificate', 'FrontEnd development certification', 'Satoshi Nakamoto Nozotrox', 'Wed Aug 17 2022', 'haldsjfdowiruflakdflkajf');
			console.log('*** Result: committed');


			
			console.log('\n--> Evaluate Transaction: ReadDocument, function returns "0011" attributes');
			result = await contract.evaluateTransaction('ReadDocument', '0001');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
		
			// Let's Issue another certificate
			console.log('\n--> Submit Transaction: IssueDocument, creates new asset with ID, color, owner, size, and appraisedValue arguments');
			result = await contract.submitTransaction('IssueDocument', '0002', 'ISCTEM', 'CERTIFICATE', 'CERTIFICATE OF COMPLETION', 'Satoshi Nakamoto', 'Wed Aug 17 2022', 'haldsjfdowiruflakdflkajf');
			
			console.log('*** Result: committed');
			if (`${result}` !== '') {
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			}

			console.log('\n--> Evaluate Transaction: GetAllDocuments, function returns "asset1" attributes');
			result = await contract.evaluateTransaction('GetAllDocuments', 'asset1');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			
			*/

		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
		
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}

main();
