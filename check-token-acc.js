const { Connection, PublicKey } = require('@solana/web3.js');

async function check() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const addr = '7ozoNcVqgptbAUHjLR1vNHgEfKiE5aYufStEHzJhxKeG';
  
  try {
    const bal = await conn.getTokenAccountBalance(new PublicKey(addr));
    console.log('Balance:', bal.value.uiAmount);
  } catch (err) {
    console.log('Not a token account or error:', err.message);
  }
}
check();
