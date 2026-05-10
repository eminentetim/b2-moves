import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RpcService } from './src/modules/rpc/rpc.service';
import { PublicKey } from '@solana/web3.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const rpc = app.get(RpcService);
  const conn = rpc.getConnection();
  
  const addr = '7ozoNcVqgptbAUHjLR1vNHgEfKiE5aYufStEHzJhxKeG';
  const info = await conn.getAccountInfo(new PublicKey(addr));
  
  if (!info) {
    console.log('Account not found.');
  } else {
    console.log('Owner:', info.owner.toBase58());
    console.log('Data Length:', info.data.length);
    if (info.data.length === 165) {
        console.log('This looks like an SPL Token Account.');
    }
  }
  
  await app.close();
}
bootstrap();
