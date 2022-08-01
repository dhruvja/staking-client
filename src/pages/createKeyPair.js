const fs = require('fs')
const bs58 = require('bs58')
const anchor = require("@project-serum/anchor")

// const account = anchor.web3.Keypair.generate()
const secret = "2HKjYz8yfQxxhRS5f17FRCx9kDp7ATF5R4esLnKA4VaUsMA5zquP5XkQmvv9J5ZUD6wAjD4iBPYXDzQDNZmQ1eki";
const account = new Uint8Array(bs58.decode(secret))
fs.writeFileSync('./keypair.json', JSON.stringify(account))