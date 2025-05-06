import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';

interface AuthFormProps {
  isAnonymous?: boolean;
  setAnonymousMode?: (mode: boolean) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({isAnonymous = false, setAnonymousMode = () => {}}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await loginWithEmail(email, password);
    } else {
      await signUpWithEmail(email, password);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" component="h1" align="center" gutterBottom>
        {isLogin ? 'Sign In' : 'Sign Up'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : isLogin ? 'Sign In' : 'Sign Up'}
        </Button>
        
        <Divider sx={{ my: 2 }}>OR</Divider>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={loginWithGoogle}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Continue with Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={() => {
            setAnonymousMode(true);
          }}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Continue as Anonymous
        </Button>
        
        <Typography variant="body2" align="center">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Button 
            onClick={() => setIsLogin(!isLogin)}
            size="small"
            disabled={loading}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </Button>
        </Typography>
      </Box>
    </Paper>
  );
};

export default AuthForm;