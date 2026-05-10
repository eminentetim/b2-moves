"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const rpc_service_1 = require("./src/modules/rpc/rpc.service");
const web3_js_1 = require("@solana/web3.js");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const rpc = app.get(rpc_service_1.RpcService);
    const conn = rpc.getConnection();
    const addr = '7ozoNcVqgptbAUHjLR1vNHgEfKiE5aYufStEHzJhxKeG';
    const info = await conn.getAccountInfo(new web3_js_1.PublicKey(addr));
    if (!info) {
        console.log('Account not found.');
    }
    else {
        console.log('Owner:', info.owner.toBase58());
        console.log('Data Length:', info.data.length);
        if (info.data.length === 165) {
            console.log('This looks like an SPL Token Account.');
        }
    }
    await app.close();
}
bootstrap();
//# sourceMappingURL=check-addr.js.map