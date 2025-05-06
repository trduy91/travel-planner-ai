import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/auth/AuthForm';
import ChatWindow from '@/components/chat/ChatWindow';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useState } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const [anonymousMode, setAnonymousMode] = useState(false);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // return user ? <ChatWindow /> : <AuthForm />;
  if (anonymousMode) {
    return (
      <ChatWindow isAnonymous={anonymousMode} setAnonymousMode={setAnonymousMode} />
    );
  }

  return user ? (
    <ChatWindow />
  ) : (
    <AuthForm isAnonymous={anonymousMode} setAnonymousMode={setAnonymousMode} />
  );
}