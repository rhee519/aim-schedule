import React from "react";
import MyCalendar from "../components/MyCalendar";
import TodoList from "../components/TodoList";
import WorkTimeForm from "../components/WorkTimeForm";

const Home = ({ userData }) => {
  return (
    <div>
      <h2>환영합니다, {userData.displayName}님!</h2>
      <WorkTimeForm userData={userData} />
      <TodoList userData={userData} />
      <MyCalendar userData={userData} />
    </div>
  );
};

export default Home;
