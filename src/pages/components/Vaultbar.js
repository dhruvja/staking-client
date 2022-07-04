import React, { useState } from "react";
import { Segment, Menu, Icon } from "semantic-ui-react";
import { Link, Redirect } from "react-router-dom";

function Vaultbar(props) {
  const [logout, setLogout] = useState(false);

  const handleItemClick = () => {
    console.log("Item Clicked");
  };

  const handleLogout = (e) => {
    var c = document.cookie.split("; ");
    var i = 0;
    for (i in c)
      document.cookie =
        /^[^=]+/.exec(c[i])[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setLogout(true);
  };

  const connectToWeb3 = async () => {
    const { solana } = window;
    if (solana && solana.isPhantom) {
      try {
        const response = await solana.connect({ onlyIfTrusted: true });
        console.log(response.publicKey.toString());
      } catch (error) {
        const response = await solana.connect();
        console.log(response.publicKey.toString());
      }
    }
  };

  return (
    <div>
      {logout && <Redirect to="/" />}
      <Segment inverted>
        <Menu inverted pointing secondary>
          {/* <Link
            to={{
              pathname: "/vault",
              state: { private_key: props.private },
            }}
          >
            <Menu.Item
              name="Home"
              active={props.type === "home"}
              onClick={handleItemClick}
            />
          </Link>
          <Link to="/register">
            <Menu.Item
              name="Strength"
              active={props.type === "strength"}
              onClick={handleItemClick}
            />
          </Link>
          <Link to="/register">
            <Menu.Item
              name="Add Item"
              active={props.type === "additem"}
              onClick={handleItemClick}
            />
          </Link> */}
          {/* <Link to="/register"> */}
          <Menu.Item
            name="Solana Staking"
            active
            onClick={handleItemClick}
          />
          {/* </Link>  */}
          <Menu.Menu position="right">
            <Menu.Item name="video camera">
              {props.connection ? (
                <Icon name="circle" color="green" onClick={connectToWeb3} />
              ) : (
                <Icon name="circle" color="red" onClick={connectToWeb3} />
              )}
              {props.connection ? "Connected" : "Not Connected"}
            </Menu.Item>
          </Menu.Menu>
        </Menu>
      </Segment>
    </div>
  );
}

export default Vaultbar;
