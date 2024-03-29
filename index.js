const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Function to validate a transaction
function validateTransaction(transaction) {
  if (!transaction || !transaction.vin || !Array.isArray(transaction.vin) || transaction.vin.length === 0 ||
    !transaction.vout || !Array.isArray(transaction.vout) || transaction.vout.length === 0) {
    return false;
  }

  for (const input of transaction.vin) {
    if (!isValidSignature(input) || !isInputUnspent(input)) {
      return false;
    }
  }

  for (const output of transaction.vout) {
    if (output.value <= 0 || !isAddressValid(output.scriptpubkey_address)) {
      return false;
    }
  }

  // Additional validation rules and checks...

  return true;
}

// Function to validate signature
function isValidSignature(input) {
  // Check if input object and required properties exist
  if (!input || !input.publicKey || !input.message || !input.signature) {
    return false;
  }

  const publicKey = input.publicKey;
  const message = input.message;
  const signature = input.signature;

  const verifier = crypto.createVerify('SHA256');
  verifier.update(message);
  const isSignatureValid = verifier.verify(publicKey, signature, 'hex');

  return isSignatureValid;
}

// Function to check if input is unspent
function isInputUnspent(input) {
  if (!input || !input.vin || !Array.isArray(input.vin) || input.vin.length === 0) {
    return false;
  }

  for (const vinItem of input.vin) {
    if (vinItem.is_coinbase) {
      return false;
    }
  }

  return true;
}

// Function to validate address
function isAddressValid(address) {
  const bitcoinAddressRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  return typeof address === 'string' && bitcoinAddressRegex.test(address);
}

// Function to read and validate transactions from mempool folder
function readAndValidateTransactions(folderPath) {
  const files = fs.readdirSync(folderPath);
  const validTransactions = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    let transaction;
    try {
      transaction = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error('Error reading transaction file:', err);
      continue; // Continue to the next file if unable to read or parse transaction
    }

    if (validateTransaction(transaction)) {
      validTransactions.push(transaction);
    }
  }

  return validTransactions;
}

// Function to mine block and generate output.txt
function mineBlockAndGenerateOutput(validTransactions) {
  const blockHeader = {
    version: 1,
    previousBlockHash: '0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: Math.floor(Date.now() / 1000),
    difficultyTarget: '0000ffff00000000000000000000000000000000000000000000000000000000',
  };

  const coinbaseTransaction = {
    txid: crypto.randomBytes(16).toString('hex'),
    inputs: [],
    outputs: [{ scriptpubkey_address: 'bc1qec944gx6cu3e0292t2zajz3vldr0pa3sh356d9', value: 50 }],
  };

  const serializedCoinbase = JSON.stringify(coinbaseTransaction);
  const serializedTransactions = validTransactions.map((transaction) => JSON.stringify(transaction));

  let blockHash;
  let nonce = 0;
  do {
    const headerString = JSON.stringify(blockHeader) + serializedCoinbase + serializedTransactions.join('');
    const hash = crypto.createHash('sha256').update(headerString + nonce).digest('hex');
    blockHash = crypto.createHash('sha256').update(hash).digest('hex');
    nonce++;
  } while (parseInt(blockHash, 16) >= parseInt(blockHeader.difficultyTarget, 16));

  const outputFilePath = './output.txt';
  const outputData = [JSON.stringify(blockHeader), serializedCoinbase, ...serializedTransactions.map((tx) => JSON.parse(tx).txid)];
  const outputContent = outputData.join('\n');

  fs.writeFileSync(outputFilePath, outputContent, 'utf-8');
}

// Main function to orchestrate the process
function main() {
  const mempoolFolderPath = path.join(__dirname, 'mempool');
  const validTransactions = readAndValidateTransactions(mempoolFolderPath);
  mineBlockAndGenerateOutput(validTransactions);
  console.log('Block mined and output.txt generated successfully!');
}

// Execute main function
main();
