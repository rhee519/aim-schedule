import React from "react";
import Summary from "../components/Summary";

const Home = ({ userData }) => {
  return (
    <div>
      <h2>환영합니다, {userData.displayName}님!</h2>
      <Summary userData={userData} />
    </div>
  );
};

export default Home;
