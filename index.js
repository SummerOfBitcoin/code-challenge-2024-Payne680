const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Read JSON files in the mempool folder
const mempoolFolderPath = path.join(__dirname, 'mempool');
const mempoolFiles = fs.readdirSync(mempoolFolderPath);

// Helper function to validate a transaction
function validateTransaction(transaction) {
  if (!Array.isArray(transaction.inputs)) {
    return false;
  }

  for (const input of transaction.inputs) {
    if (!isValidSignature(input)) {
      return false;
    }

    // Additional input validation checks...
    if (!isInputUnspent(input)) {
      return false;
    }
  }

  for (const output of transaction.outputs) {
    if (output.amount <= 0) {
      return false;
    }

    // Additional output validation checks...
    if (!isAddressValid(output.address)) {
      return false;
    }
  }

  // Additional validation rules and checks...

  return true;
}

function isValidSignature(input) {
  const publicKey = input.publicKey;
  const message = input.message;
  const signature = input.signature;

  // Verify the signature using the public key and message
  const verifier = crypto.createVerify('SHA256');
  verifier.update(message);
  const isValid = verifier.verify(publicKey, signature, 'hex');

  return isValid;
}

function isInputUnspent(input) {
  // Implement input unspent validation logic
  // Return true if the input is unspent, false otherwise

  // Placeholder implementation
  const isUnspent = input.isUnspent; // Assuming the input has an 'isUnspent' property
  return isUnspent;
}

function isAddressValid(address) {
  // Implement address validation logic
  // Return true if the address is valid, false otherwise

  // Placeholder implementation
  const isValidAddress = validateAddressFormat(address); // Assuming a separate function to validate the address format
  return isValidAddress;
}

function validateAddressFormat(address) {
  // Implement address format validation logic
  // Return true if the address format is valid, false otherwise

  // Placeholder implementation
  // Example: Check if the address starts with '0x' for Ethereum addresses
  return address.startsWith('0x');
}

// Array to store valid transactions
const validTransactions = [];

// Iterate through each transaction file
mempoolFiles.forEach((file) => {
  const filePath = path.join(mempoolFolderPath, file);
  const transaction = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Validate the transaction
  if (validateTransaction(transaction)) {
    validTransactions.push(transaction);
  }
});

// Construct the block header
const blockHeader = {
  version: 1,
  previousBlockHash: '0000000000000000000000000000000000000000000000000000000000000000', // Placeholder for previous block hash
  timestamp: Math.floor(Date.now() / 1000),
  difficultyTarget: '0000ffff00000000000000000000000000000000000000000000000000000000',
};

// Create the coinbase transaction
const coinbaseTransaction = {
  txid: 'coinbase', // Placeholder for coinbase transaction ID
  inputs: [], // Placeholder for coinbase transaction inputs
  outputs: [], // Placeholder for coinbase transaction outputs
};

// Serialize the coinbase transaction and valid transactions
const serializedCoinbase = JSON.stringify(coinbaseTransaction);
const serializedTransactions = validTransactions.map((transaction) => JSON.stringify(transaction));

// Calculate the block hash
let blockHash;
let nonce = 0;
do {
  const headerString = JSON.stringify(blockHeader) + serializedCoinbase + serializedTransactions.join('');
  const hash = crypto.createHash('sha256').update(headerString + nonce).digest('hex');
  blockHash = crypto.createHash('sha256').update(hash).digest('hex');
  nonce++;
} while (blockHash >= blockHeader.difficultyTarget);

// Generate the output.txt file
const outputFilePath = './output.txt';
const outputData = [JSON.stringify(blockHeader), serializedCoinbase, ...serializedTransactions.map((tx) => JSON.parse(tx).txid)];
const outputContent = outputData.join('\n');

fs.writeFileSync(outputFilePath, outputContent, 'utf-8');

console.log('Block mined and output.txt generated successfully!');