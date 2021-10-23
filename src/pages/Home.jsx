import React, { useContext } from "react";
import Summary from "../components/Summary";
import { UserContext } from "../contexts/Context";
import "../css/Home.scss";

const Home = () => {
  const userData = useContext(UserContext);
  return (
    <div className="home--container">
      <h2 className="home--title">환영합니다, {userData.userName}님!</h2>
      <Summary userData={userData} />
    </div>
  );
};

export default Home;
