import React from "react";
import MyCalendar from "../components/MyCalendar";

const Home = ({ userData }) => {
  return (
    <div>
      <h2>환영합니다, {userData.displayName}님!</h2>
      <MyCalendar userData={userData} />
    </div>
  );
};

export default Home;
