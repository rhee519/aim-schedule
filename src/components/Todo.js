import React from "react";

const Todo = ({ text, done, id }) => {
  return (
    <li id={id}>
      <span id={id}>{text}</span>
    </li>
  );
};

export default Todo;
