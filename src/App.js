import "./App.css";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";
import Login from "./pages/Login";
import Stake from './pages/Stake.js';

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
            <Route path="/stake" component={Stake} />
            <Route path="/" component={Login} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
