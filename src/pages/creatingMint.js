const { createMint } = require("@solana/spl-token");
const {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const fs = require("fs");
const {PublicKey, web3}  = require("@project-serum/anchor")
const kp = require('./keypair.json');

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

(async () => {
  await connection.confirmTransaction(
    await connection.requestAirdrop(baseAccount.publicKey, 100000000),
    "confirmed"
  );

  const mint = await createMint(
    connection,
    baseAccount,
    baseAccount.publicKey,
    null,
    6 // We are using 9 to match the CLI decimal default exactly
  );

//   console.log(mint);

  fs.writeFileSync("./mint.json", JSON.stringify(mint));
})();
