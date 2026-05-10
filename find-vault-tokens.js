const { Connection, PublicKey } = require('@solana/web3.js');

async function findTokenAccounts() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const vault = new PublicKey('7ozoNcVqgptbAUHjLR1vNHgEfKiE5aYufStEHzJhxKeG');
  
  try {
    const accounts = await conn.getParsedTokenAccountsByOwner(vault, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    console.log(`Found ${accounts.value.length} token accounts:`);
    accounts.value.forEach((account, i) => {
        const info = account.account.data.parsed.info;
        console.log(`${i+1}. Mint: ${info.mint} | Address: ${account.pubkey.toBase58()} | Balance: ${info.tokenAmount.uiAmount}`);
    });
  } catch (err) {
    console.error(err);
  }
}
findTokenAccounts();
