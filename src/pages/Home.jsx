import React from // useContext
"react";
import Summary from "../components/Summary";
// import { UserContext } from "../contexts/Context";
// import "../css/Home.scss";

const Home = () => {
  // const userData = useContext(UserContext);
  return (
    <div className="home--container">
      <Summary />
    </div>
  );
};

export default Home;
