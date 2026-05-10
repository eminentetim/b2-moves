const { Connection, PublicKey } = require('@solana/web3.js');

async function check() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const addr = '7ozoNcVqgptbAUHjLR1vNHgEfKiE5aYufStEHzJhxKeG';
  
  try {
    const info = await conn.getAccountInfo(new PublicKey(addr));
    if (!info) {
        console.log('Account not found.');
        return;
    }
    console.log('Owner:', info.owner.toBase58());
    console.log('Data Length:', info.data.length);
    if (info.data.length === 165) {
        console.log('This is an SPL Token Account.');
    }
  } catch (err) {
    console.error(err);
  }
}
check();
