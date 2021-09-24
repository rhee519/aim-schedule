import React from "react";

const Todo = ({ text, done, id }) => {
  return (
    <li id={id}>
      <span id={id}>{text}</span>
      <input type="button" id={id} value={done ? "undo" : "done"} />
      <input type="button" id={id} value="del" />
    </li>
  );
};

export default Todo;
