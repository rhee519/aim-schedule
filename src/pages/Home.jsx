import React from "react"; // useContext
// import Summary from "../components/Summary";
import Dashboard from "../components/Dashboard";
// import { UserContext } from "../contexts/Context";
// import "../css/Home.scss";

const Home = () => {
  // const userData = useContext(UserContext);
  return (
    <div className="home--container">
      {/* <Summary /> */}
      <Dashboard />
    </div>
  );
};

export default Home;
