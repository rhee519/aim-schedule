import React from "react";
import { Box, CircularProgress } from "@mui/material";
// import Loader from "react-loader-spinner";
// import "../css/Loading.css";

const Loading = () => {
  return (
    // <Loader className="loader-spinner" type="Oval" width={50} color="#6e7eb1" />
    <Box sx={{ display: "flex" }}>
      <CircularProgress />
    </Box>
  );
};

export default Loading;
