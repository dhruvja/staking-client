import React, { useState, useEffect } from "react";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import {
  Menu,
  Segment,
  Header,
  List,
  Grid,
  Card,
  Button,
  Dimmer,
  Loader,
  Modal,
  Icon,
  Form,
  Message,
  Dropdown,
  Label,
  Radio,
} from "semantic-ui-react";
import { Redirect } from "react-router-dom";
import kp from "./keypair.json";
import general from "./idl/general.json";
import job from "./idl/job.json";
import application from "./idl/application.json";
import candidateStaking from "./idl/candidate_staking.json";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import Vaultbar from "./components/Vaultbar";
import * as spl from "@solana/spl-token";
import tokenMint from "./mint.json";
import * as anchor from "@project-serum/anchor";
import data from "./data.json";
import { v4 as uuidv4 } from "uuid";
const fs = require("fs");

// import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const bs58 = require("bs58");

const { SystemProgram } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const generalProgramID = new PublicKey(general.metadata.address);
const jobProgramID = new PublicKey(job.metadata.address);
const applicationProgramID = new PublicKey(application.metadata.address);
const candidateStakingProgramID = new PublicKey(
  candidateStaking.metadata.address
);

// Set our network to devnet.
const network = clusterApiUrl("devnet");

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed",
};

const connection = new Connection(network, opts.preflightCommitment);

function Stake(props) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [present, setPresent] = useState(false);
  const [initialise, setInitialise] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [jobIndex, setJobIndex] = useState(0);
  const [connected, setConnected] = useState(false);
  const [formValues, setFormValues] = useState({
    mintTokens: "",
    depositTokens: "",
    rewardTokens: "",
  });
  const [totalTokens, setTotalTokens] = useState(0);
  const [initialSignatories, setInitialSignatories] = useState([]);
  const [threshold, setThreshold] = useState(0);
  const [signatory, setSignatory] = useState(null);
  const [selectedPresent, setSelectedPresent] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [jobError, setJobError] = useState(true);
  const [applicationError, setApplicationError] = useState(true);
  const [applicationState, setApplicationState] = useState("");
  const [totalRewardToBeGiven, setTotalRewardToBeGiven] = useState(0);

  // const {sendTransaction} = useWallet();

  const getProvider = () => {
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const getBalance = async (wallet) => {
    const tokenMintKey = new anchor.web3.PublicKey(tokenMint);

    let userTokenAccount = await spl.getAssociatedTokenAddress(
      tokenMintKey,
      wallet,
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    try {
      const balance = await spl.getAccount(connection, userTokenAccount);
      console.log(balance.amount.toString());
      setTotalTokens(balance.amount.toString());
    } catch (error) {
      console.log(error);
    }
  };

  const checkSolanaWalletExists = async () => {
    const { solana } = window;

    if (solana && solana.isPhantom) {
      try {
        const response = await solana.connect({ onlyIfTrusted: true });
        console.log(response.publicKey.toString());
        setWallet(response.publicKey);
        setConnected(true);
        getBalance(response.publicKey);
      } catch (error) {
        const response = await solana.connect();
        console.log(response.publicKey.toString());
        setWallet(response.publicKey);
        setConnected(true);
        getBalance(response.publicKey);
      }
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkSolanaWalletExists();
      setSelectedApplication(props.match.params.application);
      setSelectedJob(props.match.params.job);
      setJobIndex(0);
      setSelectedPresent(true);
      await getDetails(props.match.params.application, props.match.params.job);
    };
    window.addEventListener("load", onLoad);

    return () => window.removeEventListener("load", onLoad);
  }, []);

  const mintTokenToAccount = async () => {
    setLoading(true);

    const tokenMintKey = new anchor.web3.PublicKey(tokenMint);
    let userTokenAccount = await spl.getAssociatedTokenAddress(
      tokenMintKey,
      wallet,
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    await getTokenAccount(userTokenAccount, tokenMintKey);

    let recentBlockhash = await connection.getRecentBlockhash();
    let transaction = new Transaction({
      recentBlockhash: recentBlockhash.blockhash,
      feePayer: wallet,
    });

    transaction.feePayer = wallet;

    transaction.add(
      spl.createMintToInstruction(
        tokenMintKey,
        userTokenAccount,
        baseAccount.publicKey,
        parseInt(formValues.mintTokens * 1000000),
        [],
        spl.TOKEN_PROGRAM_ID
      )
    );

    transaction.sign(baseAccount);
    let sign = await window.solana.signTransaction(transaction);
    let signature = await connection.sendRawTransaction(sign.serialize());
    const confirmed = await connection.confirmTransaction(signature);

    await getBalance(wallet);
    setLoading(false);
  };

  const getTokenAccount = async (userTokenAccount, tokenMintKey) => {
    try {
      const tokenAccount = await spl.getAccount(connection, userTokenAccount);
    } catch (error) {
      let recentBlockhash = await connection.getRecentBlockhash();
      let transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: wallet,
      });
      transaction.add(
        spl.createAssociatedTokenAccountInstruction(
          wallet,
          userTokenAccount,
          wallet,
          tokenMintKey,
          spl.TOKEN_PROGRAM_ID,
          spl.ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
      let sign = await window.solana.signTransaction(transaction);
      let signature = await connection.sendRawTransaction(sign.serialize());
      let result = await connection.confirmTransaction(
        signature,
        "This is my transaction"
      );

      console.log(result);
    }
  };

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const initializeGeneral = async () => {
    const provider = getProvider();
    const program = new Program(general, generalProgramID, provider);

    const [generalPDA, generalBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("general")],
        program.programId
      );

    const USDCMint = new PublicKey(tokenMint);

    try {
      await program.methods
        .initialize()
        .accounts({
          baseAccount: generalPDA,
          authority: wallet,
          tokenMint: USDCMint,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) {
      const state = await program.account.generalParameter.fetch(generalPDA);
      console.log(state.tokenMint, state.authority);
    }
  };

  const updateTokenMint = async () => {
    const provider = getProvider();
    const program = new Program(general, generalProgramID, provider);

    const [generalPDA, generalBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("general")],
        program.programId
      );

    const USDCMint = new PublicKey(tokenMint);

    try {
      const tx = await program.methods
        .changeMint(generalBump)
        .accounts({
          baseAccount: generalPDA,
          authority: wallet,
          tokenMint: USDCMint,
        })
        .rpc();
      console.log(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const createJob = async () => {
    const provider = getProvider();
    const jobProgram = new Program(job, jobProgramID, provider);
    const generalProgram = new Program(general, generalProgramID, provider);

    console.log(wallet.toBase58());

    const jobAdId = selectedJob;

    const [generalPDA, generalBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("general")],
        generalProgram.programId
      );

    const [jobPDA, jobBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("jobfactory"),
        Buffer.from(jobAdId.substring(0, 18)),
        Buffer.from(jobAdId.substring(18, 36)),
      ],
      jobProgram.programId
    );

    try {
      const tx = await jobProgram.methods
        .initialize(
          jobAdId,
          generalBump,
          data.jobs[jobIndex].maxAmountPerApplication
        )
        .accounts({
          baseAccount: jobPDA,
          authority: wallet,
          generalAccount: generalPDA,
          generalProgram: generalProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log(tx);
    } catch (error) {
      console.log(error);
    }
    await getDetails(selectedApplication, selectedJob);
  };

  const createApplication = async () => {
    const provider = getProvider();
    const applicationProgram = new Program(
      application,
      applicationProgramID,
      provider
    );

    const applicationId = selectedApplication;
    const jobAdId = selectedJob;
    const generalProgram = new Program(general, generalProgramID, provider);

    const [generalPDA, generalBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("general")],
        generalProgram.programId
      );

    const [applicationPDA, applicationBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("application"),
          Buffer.from(applicationId.substring(0, 18)),
          Buffer.from(applicationId.substring(18, 36)),
        ],
        applicationProgram.programId
      );

    try {
      let tx = await applicationProgram.methods
        .initialize(
          jobAdId,
          applicationId,
          generalBump,
          data.jobs[jobIndex].maxAmountPerApplication
        )
        .accounts({
          baseAccount: applicationPDA,
          authority: wallet,
          generalAccount: generalPDA,
          generalProgram: generalProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log(tx);
      await getDetails();
    } catch (error) {
      console.log(error);
    }
    await getDetails(selectedApplication, selectedJob);
  };

  const stakeApplication = async () => {
    const provider = getProvider();
    const applicationProgram = new Program(
      application,
      applicationProgramID,
      provider
    );
    const jobProgram = new Program(job, jobProgramID, provider);
    const generalProgram = new Program(general, generalProgramID, provider);
    const candidateStakingProgram = new Program(
      candidateStaking,
      candidateStakingProgramID,
      provider
    );

    const applicationId = selectedApplication;
    const jobAdId = selectedJob;

    const [generalPDA, generalBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("general")],
        generalProgram.programId
      );

    const [applicationPDA, applicationBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("application"),
          Buffer.from(applicationId.substring(0, 18)),
          Buffer.from(applicationId.substring(18, 36)),
        ],
        applicationProgram.programId
      );

    const [jobPDA, jobBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("jobfactory"),
        Buffer.from(jobAdId.substring(0, 18)),
        Buffer.from(jobAdId.substring(18, 36)),
      ],
      jobProgram.programId
    );

    const [candidatePDA, candidateBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("candidate"),
          Buffer.from(applicationId.substring(0, 18)),
          Buffer.from(applicationId.substring(18, 36)),
          wallet.toBuffer(),
        ],
        candidateStakingProgram.programId
      );

    const [walletPDA, walletBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("wallet"),
          Buffer.from(applicationId.substring(0, 18)),
          Buffer.from(applicationId.substring(18, 36)),
          wallet.toBuffer(),
        ],
        candidateStakingProgram.programId
      );

    const USDCMint = new PublicKey(tokenMint);

    let userTokenAccount = await spl.getAssociatedTokenAddress(
      USDCMint,
      wallet,
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const deposit = new anchor.BN(formValues.depositTokens);

    try {
      const state =
        await candidateStakingProgram.account.candidateParameter.fetch(
          candidatePDA
        );
      console.log(state.stakedAmount);
    } catch (error) {
      console.log(error);
      const tx = await candidateStakingProgram.methods
        .initialize(jobAdId, applicationId)
        .accounts({
          baseAccount: candidatePDA,
          escrowWalletState: walletPDA,
          tokenMint: USDCMint,
          authority: wallet,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      console.log(tx);
    }

    try {
      const tx = await candidateStakingProgram.methods
        .stake(
          jobAdId,
          applicationId,
          candidateBump,
          generalBump,
          applicationBump,
          jobBump,
          walletBump,
          deposit
        )
        .accounts({
          baseAccount: candidatePDA,
          authority: wallet,
          tokenMint: USDCMint,
          generalAccount: generalPDA,
          // jobAccount: jobPDA,
          applicationAccount: applicationPDA,
          generalProgram: generalProgram.programId,
          applicationProgram: applicationProgram.programId,
          jobProgram: jobProgram.programId,
          escrowWalletState: walletPDA,
          walletToWithdrawFrom: userTokenAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      await getBalance(wallet);
      console.log(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const updateState = async () => {
    const provider = getProvider();
    const applicationProgram = new Program(
      application,
      applicationProgramID,
      provider
    );

    const applicationId = selectedApplication;

    const [applicationPDA, applicationBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("application"),
          Buffer.from(applicationId.substring(0, 18)),
          Buffer.from(applicationId.substring(18, 36)),
        ],
        applicationProgram.programId
      );

    let state;

    if (applicationState === "selected") {
      state = { selected: {} };
    } else if (applicationState === "rejected") {
      state = { rejected: {} };
    }

    try {
      const tx = await applicationProgram.methods
        .updateStatus(applicationId, applicationBump, state)
        .accounts({
          baseAccount: applicationPDA,
          authority: wallet,
        })
        .rpc();

      state = await applicationProgram.account.applicationParameter.fetch(
        applicationPDA
      );

      console.log(tx, state.status);
    } catch (error) {
      console.log(error);
    }
  };

  const unstake = async () => {
    const provider = getProvider();
    const applicationProgram = new Program(
      application,
      applicationProgramID,
      provider
    );
    const jobProgram = new Program(job, jobProgramID, provider);
    const generalProgram = new Program(general, generalProgramID, provider);
    const candidateStakingProgram = new Program(
      candidateStaking,
      candidateStakingProgramID,
      provider
    );

    const applicationId = selectedApplication;
    const jobAdId = selectedJob;

    const [generalPDA, generalBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("general")],
        generalProgram.programId
      );

    const [applicationPDA, applicationBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("application"),
          Buffer.from(applicationId.substring(0, 18)),
          Buffer.from(applicationId.substring(18, 36)),
        ],
        applicationProgram.programId
      );

    const [jobPDA, jobBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("jobfactory"),
        Buffer.from(jobAdId.substring(0, 18)),
        Buffer.from(jobAdId.substring(18, 36)),
      ],
      jobProgram.programId
    );

    const [candidatePDA, candidateBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("candidate"),
          Buffer.from(applicationId.substring(0, 18)),
          Buffer.from(applicationId.substring(18, 36)),
          wallet.toBuffer(),
        ],
        candidateStakingProgram.programId
      );

    const [walletPDA, walletBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("wallet"),
          Buffer.from(applicationId.substring(0, 18)),
          Buffer.from(applicationId.substring(18, 36)),
          wallet.toBuffer(),
        ],
        candidateStakingProgram.programId
      );

    const USDCMint = new PublicKey(tokenMint);

    let userTokenAccount = await spl.getAssociatedTokenAddress(
      USDCMint,
      wallet,
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    try {
      const tx = await candidateStakingProgram.methods
        .unstake(candidateBump, applicationBump, walletBump, applicationId)
        .accounts({
          baseAccount: candidatePDA,
          authority: wallet,
          tokenMint: USDCMint,
          applicationAccount: applicationPDA,
          applicationProgram: applicationProgram.programId,
          escrowWalletState: walletPDA,
          walletToDepositTo: userTokenAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log(tx);
      await getBalance(wallet);
    } catch (error) {
      console.log(error);
    }
  };

  const mintTokensForRewards = async () => {
    const provider = getProvider();
    const candidateStakingProgram = new Program(
      candidateStaking,
      candidateStakingProgramID,
      provider
    );

    const applicationId = selectedApplication;

    const [walletPDA, walletBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("wallet"),
          Buffer.from(applicationId.substring(0, 18)),
          Buffer.from(applicationId.substring(18, 36)),
          wallet.toBuffer(),
        ],
        candidateStakingProgram.programId
      );

    const USDCMint = new PublicKey(tokenMint);

    // let balance = await spl.getAccount(provider, walletPDA);
    // console.log(balance.amount)

    await spl.mintTo(
      provider,
      wallet,
      USDCMint,
      walletPDA,
      baseAccount.publicKey,
      formValues.rewardTokens
    );

    // balance = await spl.getAccount(provider, walletPDA);
    // console.log(balance.amount)
  };

  const transferTokenToAccount = async () => {
    const provider = getProvider();
    const candidateStakingProgram = new Program(
      candidateStaking,
      candidateStakingProgramID,
      provider
    );

    const applicationId = selectedApplication;
    const jobAdId = selectedJob;

    const [walletPDA, walletBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("wallet"),
          Buffer.from(jobAdId.substring(0, 18)),
          Buffer.from(jobAdId.substring(18, 36)),
        ],
        candidateStakingProgramID
      );

    const [jobPDA, jobBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("jobfactory"),
        Buffer.from(
          jobAdId.substring(0, 18),
          Buffer.from(jobAdId.substring(18, 36))
        ),
      ],
      jobProgramID
    );

    let recentBlockhash = await connection.getRecentBlockhash();
    let manualTransaction = new Transaction({
      recentBlockhash: recentBlockhash.blockhash,
      feePayer: wallet,
    });

    const PDABalance = await spl.getAccount(connection, walletPDA);
    console.log(PDABalance.amount.toString());
    const amount = Math.abs(totalRewardToBeGiven - parseInt(PDABalance.amount))


    const tokenMintKey = new anchor.web3.PublicKey(tokenMint);

    let userTokenAccount = await spl.getAssociatedTokenAddress(
      tokenMintKey,
      wallet,
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log(amount)

    manualTransaction.add(
      spl.createTransferInstruction(
        userTokenAccount,
        walletPDA,
        wallet, 
        amount
      )
    );
    let sign = await window.solana.signTransaction(manualTransaction);
    let signature = await connection.sendRawTransaction(sign.serialize());
    let result = await connection.confirmTransaction(
      signature,
      "myFirstTransaction"
    );
    console.log("sent money", result);
    alert("Tipped Successfully");
    setLoading(false);
    await getBalance();
  };

  const getDetails = async (appId, jobId) => {
    const provider = getProvider();
    const applicationProgram = new Program(
      application,
      applicationProgramID,
      provider
    );
    const jobProgram = new Program(job, jobProgramID, provider);

    const applicationId = appId;
    const jobAdId = jobId;

    console.log(applicationId, jobAdId);

    const [applicationPDA, applicationBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("application"),
          Buffer.from(applicationId.substring(0, 18)),
          Buffer.from(applicationId.substring(18, 36)),
        ],
        applicationProgram.programId
      );

    const [jobPDA, jobBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("jobfactory"),
        Buffer.from(jobAdId.substring(0, 18)),
        Buffer.from(jobAdId.substring(18, 36)),
      ],
      jobProgram.programId
    );

    let jobs = true;

    try {
      const state = await jobProgram.account.jobStakingParameter.fetch(jobPDA);
      setTotalRewardToBeGiven(state.totalRewardToBeGiven.toNumber());
      console.log(state);
      setJobError(true);
    } catch (error) {
      jobs = false;
      setJobError(false);
      console.log(error);
    }

    if (jobs) {
      try {
        const state =
          await applicationProgram.account.applicationParameter.fetch(
            applicationPDA
          );
        console.log(state);
        setApplicationError(true);
      } catch (error) {
        setApplicationError(false);
        console.log(error);
      }
    }
  };

  const selectApplication = async (applicationId, jobId, index) => {
    setSelectedApplication(applicationId);
    setSelectedJob(jobId);
    setJobIndex(index);
    setSelectedPresent(true);
    await getDetails(applicationId, jobId);

    console.log(applicationId, jobId);
  };

  const handleRadioChange = async (e, { value }) => {
    setApplicationState(value);
  };

  return (
    <div>
      <Modal
        basic
        onClose={() => setInitialise(false)}
        open={initialise}
        size="small"
      >
        {" "}
        <Header icon>
          <Icon name="archive" />
          Initialization
        </Header>
        <Modal.Content>
          <p>
            Please click the button to do one time initiazation of the account.
          </p>
        </Modal.Content>
        <Modal.Actions>
          <Button color="green" inverted>
            <Icon name="checkmark" /> Initialise
          </Button>
        </Modal.Actions>
      </Modal>
      <Vaultbar connection={connected} />
      <Header as="h1">Staking</Header>
      <div className="content">
        <Segment className="content leftAlign">
          <Header as="h2" dividing>
            Staking Program
          </Header>
          <Button onClick={initializeGeneral}>
            Initialize General Program
          </Button>
          <Button onClick={updateTokenMint}>Update Token Mint</Button>
          <br /> <br />
          <Button onClick={createJob}>Create Job</Button>
          <Button onClick={createApplication}>Create Application</Button>
          <br />
          <br />
          <Form>
            <Form.Field>
              <label>Enter amount of tokens to mint</label>
              <input
                placeholder="Enter amount of tokens"
                type="number"
                name="mintTokens"
                value={formValues.mintTokens}
                onChange={handleChange}
              />
            </Form.Field>
            {loading ? (
              <Button loading primary>
                Mint Tokens
              </Button>
            ) : (
              <Button onClick={mintTokenToAccount} primary>
                Mint Tokens
              </Button>
            )}
            <br />
            <br />
            <Form.Field>
              <label>Enter amount of tokens to transfer</label>
              <input
                placeholder="Enter amount of tokens"
                type="number"
                name="depositTokens"
                value={formValues.depositTokens}
                onChange={handleChange}
              />
            </Form.Field>
            {loading ? (
              <Button loading primary>
                Transfer Tokens
              </Button>
            ) : (
              <Button onClick={transferTokenToAccount} primary>
                Transfer Tokens
              </Button>
            )}
            <br />
            <br />
            {/* <Form.Field>
              <label>Enter amount of tokens to deposit</label>
              <input
                placeholder="Enter amount of tokens"
                type="number"
                name="depositTokens"
                value={formValues.depositTokens}
                onChange={handleChange}
              />
            </Form.Field>
            {loading ? (
              <Button loading color="teal">
                Stake Tokens
              </Button>
            ) : (
              <Button onClick={stakeApplication} color="teal">
                Stake Tokens
              </Button>
            )}
            <br />
            <br />
            <Form.Group inline>
              <label>Select Application Status</label>
              <Form.Field
                control={Radio}
                label="Selected"
                value="selected"
                checked={applicationState === "selected"}
                onChange={handleRadioChange}
              />
              <Form.Field
                control={Radio}
                label="Rejected"
                value="rejected"
                checked={applicationState === "rejected"}
                onChange={handleRadioChange}
              />
            </Form.Group>
            <Button onClick={updateState}>Update Application Status</Button>
            <Button onClick={unstake} primary>Withdraw Rewards if any</Button>
            <br /><br />
            <Form.Field>
              <label>Enter amount of tokens to mint to pay for rewards</label>
              <input
                placeholder="Enter amount of tokens"
                type="number"
                name="rewardTokens"
                value={formValues.rewardTokens}
                onChange={handleChange}
              />
            </Form.Field>
            {loading ? (
              <Button loading primary>
                Mint Tokens
              </Button>
            ) : (
              <Button onClick={mintTokensForRewards} primary>
                Mint Tokens
              </Button>
            )} */}
            {jobError && (
              <Message color="teal">
                {/* <Message.Header>Job Status: {allData.status}</Message.Header> */}
                <Message.Header>
                  Total Balance to be present: {totalRewardToBeGiven}
                </Message.Header>
              </Message>
            )}
            <Message color="teal">
              <Message.Header>
                Total Tokens: {parseInt(totalTokens / 1000000)}{" "}
              </Message.Header>
            </Message>
            {!selectedPresent && (
              <Message color="teal">
                <Message.Header>
                  Please click the application Id(in blue) below to start
                  staking{" "}
                </Message.Header>
              </Message>
            )}
            {selectedPresent && (
              <Message color="teal">
                <Message.Header>
                  Selected Application: {selectedApplication}{" "}
                </Message.Header>
                <Message.Header>Selected Job: {selectedJob} </Message.Header>
              </Message>
            )}
            {selectedPresent &&
              (!jobError ? (
                <Message color="teal">
                  <Message.Header>
                    The job with id: {selectedJob} has not been created yet
                  </Message.Header>
                </Message>
              ) : !applicationError ? (
                <Message color="teal">
                  <Message.Header>
                    The application with id: {selectedApplication} has not been
                    created yet but the job has been created
                  </Message.Header>
                </Message>
              ) : (
                <Message color="teal">
                  <Message.Header>
                    Both job and application have been created, you can stake
                    now
                  </Message.Header>
                </Message>
              ))}
            {/* <Header as="h2">Jobs and applications</Header> */}
            {/* <Header as="h4">
              Click on the application id below to start staking
            </Header>
            {data.jobs.map((job, index) => {
              return (
                <List ordered>
                  <List.Header as="h4">Job Id: {job.id}</List.Header>
                  {job.applicants.map((application, indexs) => {
                    return (
                      <List.Item
                        as="a"
                        onClick={() =>
                          selectApplication(application.id, job.id, index)
                        }
                      >
                        {application.id}
                      </List.Item>
                    );
                  })}
                </List>
              );
            })} */}
          </Form>
        </Segment>
      </div>
    </div>
  );
}

export default Stake;
