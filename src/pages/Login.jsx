import { GoogleAuthProvider, signInWithRedirect } from "@firebase/auth";
import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import React from "react";
import { auth } from "../myFirebase";

const Login = () => {
  const onGoogleLoginClick = (event) => {
    event.preventDefault();
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  return (
    <Box
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="primary.main"
    >
      <Paper sx={{ p: 1 }}>
        <Typography
          variant="button"
          component="div"
          sx={{ m: 1, fontSize: 24 }}
        >
          Sign in
        </Typography>
        <Divider variant="fullWidth" />
        <Typography varaint="body2" component="p">
          인사 관리 서비스 AIM-Schedule입니다.
        </Typography>

        <Button
          fullWidth
          color="success"
          variant="contained"
          id="social--container"
          onClick={onGoogleLoginClick}
        >
          Continue with Google{"  "}
          <GoogleIcon fontSize="small" />
        </Button>
      </Paper>
    </Box>
  );
};

export default Login;
