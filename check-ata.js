const { Connection, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');

async function check() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  const vault = new PublicKey('7ozoNcVqgptbAUHjLR1vNHgEfKiE5aYufStEHzJhxKeG');
  const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  
  const ata = await getAssociatedTokenAddress(usdcMint, vault, true);
  console.log('Vault USDC ATA:', ata.toBase58());
  
  const info = await conn.getAccountInfo(ata);
  if (info) {
    console.log('ATA exists! Data Length:', info.data.length);
  } else {
    console.log('ATA does not exist.');
  }
}
check();
