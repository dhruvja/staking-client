const fs = require('fs')
const anchor = require("@project-serum/anchor")
const {v4} = require("uuid");
const data = require('./data.json');

const applicationId = v4();
const maxAmountPerApplication = 10000;

data.jobs[1].applicants.push({"id": applicationId});
fs.writeFileSync('./data.json', JSON.stringify(data))