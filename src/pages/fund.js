const fs = require('fs')
const bs58 = require('bs58')
const anchor = require("@project-serum/anchor")
const candidateStaking = require('./idl/candidate_staking.json')
const {PublicKey} = require('@solana/web3.js')

const candidateStakingProgramID = new PublicKey(candidateStaking.metadata.address);
const jobAdId = "75353515-ac27-43ed-b23d-4836a49200cf"

const fund = async() => {

    const [walletPDA, walletBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("wallet"),
          Buffer.from(jobAdId.substring(0, 18)),
          Buffer.from(jobAdId.substring(18, 36)),
        ],
       candidateStakingProgramID 
      );

    console.log(walletPDA.toBase58())

}

fund();