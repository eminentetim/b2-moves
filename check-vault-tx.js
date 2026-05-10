const { Connection, PublicKey } = require('@solana/web3.js');

async function checkVault() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const vaultUsdcAta = new PublicKey('5WM1vDeQWkqRkAakgQjy5NQta93kYQAusVsZNhkRWasZ');
  const userAddress = 'H2Zs7tGvccMFGpJfEumbGHCiqiDo8WBiRVoJXMHHSKKr';
  
  try {
    console.log('--- Checking Vault USDC ATA ---');
    const bal = await conn.getTokenAccountBalance(vaultUsdcAta);
    console.log('Vault Total USDC Balance:', bal.value.uiAmount);

    console.log('\n--- Checking Recent Transactions ---');
    const signatures = await conn.getSignaturesForAddress(vaultUsdcAta, { limit: 10 });
    
    for (const sig of signatures) {
        const tx = await conn.getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
        if (!tx) continue;
        
        // Look for transfers from the user's wallet
        const isFromUser = tx.transaction.message.accountKeys.some(ak => ak.pubkey.toBase58() === userAddress);
        if (isFromUser) {
            console.log(`Found Tx: ${sig.signature} | From User: YES | Status: ${tx.meta.err ? 'FAILED' : 'SUCCESS'}`);
        } else {
            console.log(`Found Tx: ${sig.signature} | From User: NO`);
        }
    }
  } catch (err) {
    console.error(err);
  }
}
checkVault();
