import React from "react";
import Summary from "../components/Summary";
import "./Home.scss";

const Home = ({ userData }) => {
  return (
    <div className="home--container">
      <h2>환영합니다, {userData.displayName}님!</h2>
      <Summary userData={userData} />
    </div>
  );
};

export default Home;
