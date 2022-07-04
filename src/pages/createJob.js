const fs = require('fs')
const anchor = require("@project-serum/anchor")
const {v4} = require("uuid");
const data = require('./data.json');

const jobId = v4();
const maxAmountPerApplication = 10000;

data.jobs.push({"id": jobId, "maxAmountPerApplication": maxAmountPerApplication, "applicants": []});
fs.writeFileSync('./data.json', JSON.stringify(data))   
