import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/auth/AuthForm';
import ChatWindow from '@/components/chat/ChatWindow';
import { Box, CircularProgress } from '@mui/material';

export default function Home() {
  const { user, loading } = useAuth();

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

  return user ? <ChatWindow /> : <AuthForm />;
}