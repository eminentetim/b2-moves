const { Connection, PublicKey } = require('@solana/web3.js');

async function check() {
  const conn = new Connection('https://api.mainnet-beta.solana.com');
  
  // Associated Token Program ID
  const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  );
  // Token Program ID
  const TOKEN_PROGRAM_ID = new PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  );

  const vault = new PublicKey('7ozoNcVqgptbAUHjLR1vNHgEfKiE5aYufStEHzJhxKeG');
  const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  
  const [ata] = PublicKey.findProgramAddressSync(
    [vault.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), usdcMint.toBuffer()],
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  );

  console.log('Vault USDC ATA:', ata.toBase58());
  
  const info = await conn.getAccountInfo(ata);
  if (info) {
    console.log('ATA exists! Data Length:', info.data.length);
  } else {
    console.log('ATA does not exist.');
  }
}
check();
