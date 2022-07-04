import React,{useState} from "react";
import Startbar from "./components/Startbar";
import {
  Button,
  Form,
  Grid,
  Header,
  Image,
  Message,
  Segment,
} from "semantic-ui-react";
import {Redirect} from 'react-router-dom'

function Login() {

  const [redirect, setRedirect] = useState(false)

  const connectWallet = async() => {
    const {solana} = window;

    if(solana && solana.isPhantom){
      const response = await solana.connect();
      console.log(response.publicKey.toString())
      document.cookie = "access=" + response.publicKey.toString()
      setRedirect(true)
    }
  }


  return (
    <div>
      <Startbar />
      {redirect && <Redirect to="/search" /> }
      <Grid
        textAlign="center"
        style={{ height: "100vh" }}
        verticalAlign="middle"
      >
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h2" textAlign="center">
            Log-in to your account
          </Header>
          <Button color="teal" fluid size="large" onClick={connectWallet}>
            Connect Wallet
          </Button>
        </Grid.Column>
      </Grid>
    </div>
  );
}

export default Login;
