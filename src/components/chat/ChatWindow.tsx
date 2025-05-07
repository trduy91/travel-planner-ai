import React, { useRef, useEffect, useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import {
  Box,
  Button,
  TextField,
  Avatar,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Stack,
  Drawer, // For the sidebar
  List as MuiList, // Renaming to avoid conflict with our messages List
  ListItem as MuiListItem, // Renaming
  ListItemButton, // For clickable list items
  ListItemText,
  AppBarProps as MuiAppBarProps,
} from '@mui/material';
import { 
  Send as SendIcon, 
  ArrowBack as ArrowBackIcon,
  AirplaneTicket as AirplaneTicketIcon,
  Hotel as HotelIcon,
  Restaurant as RestaurantIcon,
  Map as MapIcon,
  SmartToy as SmartToyIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles'; // Correct import for styled
import { motion } from 'framer-motion';

import MarkdownRenderer from './MarkdownRenderer';

const QUICK_PROMPTS = [
  { text: 'Suggest a 3-day itinerary for Paris', icon: <MapIcon /> },
  { text: 'Best beaches in Thailand', icon: <HotelIcon /> },
  { text: 'Budget travel tips for Japan', icon: <AirplaneTicketIcon /> },
  { text: 'Local food recommendations in Italy', icon: <RestaurantIcon /> },
];

const drawerWidthOpen  = 240; // Width of the sidebar
const drawerWidthClosed = (theme: any) => theme.spacing(7); // Width when closed (for icons)

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh', // Ensure main takes full height to manage its children
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0, // Start with no margin
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: `${drawerWidthOpen}px`,
  }),
}));

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<MuiAppBarProps & { open?: boolean }>(({ theme, open }) => ({ // Use MuiAppBarProps
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidthOpen}px)`,
    marginLeft: `${drawerWidthOpen}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));


const ChatWindow: React.FC = () => {
  const {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    isLoading,
    error,
    isTyping,
    appendTagToInput,
    agentConfigs
  } = useMessages();
  
  const { user, logout } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the TextField
  const [sidebarOpen, setSidebarOpen] = useState(true); // State for sidebar

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Local state for the immediate input value
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Debounce Effect: Update the context state (newMessage) after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only update if the debounced value is different from the context state
      // This check might be optional depending on how setNewMessage is implemented
      if (inputValue !== newMessage) {
          setNewMessage(inputValue);
      }
    }, 300); // Adjust debounce delay (e.g., 300ms)

    // Cleanup function to clear the timeout if inputValue changes again quickly
    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, setNewMessage, newMessage]); // Add newMessage to dependencies if needed for the check
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) { // Use inputValue for the check and sending
      sendMessage(inputValue);
      setInputValue(''); // Clear local input state
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    setNewMessage(prompt);
    await sendMessage(prompt);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Drawer
        variant="persistent" // Changed to persistent
        anchor="left"
        open={sidebarOpen} // Controlled by state
        sx={{
          width: sidebarOpen ? drawerWidthOpen : drawerWidthClosed,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarOpen ? drawerWidthOpen : drawerWidthClosed,
            boxSizing: 'border-box',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: sidebarOpen ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
            }),
            overflowX: 'hidden', // Hide text when collapsing
          },
        }}
      >
        <Toolbar /> {/* For spacing below the main AppBar */}
        <Box sx={{ overflow: 'auto', p: 1 }}>
          <MuiList>
            {agentConfigs.map((agent) => (
              <MuiListItem key={agent.alias} disablePadding>
                <ListItemButton onClick={() => {
                  const tagToAppend = `@${agent.alias}`;
                  const updatedText = appendTagToInput(tagToAppend);
                  setInputValue(updatedText);
                  inputRef.current?.focus();
                }}>
                  <SmartToyIcon sx={{ mr: 1, color: 'action.active' }} />
                  {sidebarOpen && (
                    <ListItemText primary={`@${agent.alias}`} primaryTypographyProps={{ variant: 'body2', noWrap: true }} />
                  )}
                </ListItemButton>
              </MuiListItem>
            ))}
          </MuiList>
        </Box>
      </Drawer>
      <Main open={sidebarOpen}> {/* Use styled Main component */}
        <StyledAppBar 
          position="fixed" 
          open={sidebarOpen} 
          color="primary"
          
          >
          <Toolbar>
          <IconButton
              color="inherit"
              aria-label="toggle drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <IconButton edge="start" color="inherit" onClick={logout} sx={{ mr: 1 }}> 

              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Travel Planner AI
            </Typography>
            {user && (
              <Avatar 
                alt={user.displayName || 'User'} 
                src={user.photoURL || undefined} 
                sx={{ width: 32, height: 32 }}
              />
            )}
          </Toolbar>
        </StyledAppBar>

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', mt: '64px' /* AppBar height */ }}>
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" gutterBottom>
              Quick Travel Questions:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {QUICK_PROMPTS.map((prompt, index) => (
                <Chip
                  key={index}
                  icon={prompt.icon}
                  label={prompt.text}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                />
              ))}
            </Stack>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
            <List sx={{ width: '100%' }}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ListItem 
                    sx={{ 
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      px: 1,
                    }}
                  >
                    {message.sender === 'ai' && (
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>AI</Avatar>
                      </ListItemAvatar>
                    )}
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        maxWidth: '80%',
                        bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                        color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                        borderRadius: message.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}
                    >
                      <MarkdownRenderer 
                        content={message.text}
                        agentConfigs={agentConfigs} // Pass agentConfigs
                        onTagClick={(tag) => {
                          const updatedText = appendTagToInput(tag);
                          setInputValue(updatedText); // Directly update local input value
                          inputRef.current?.focus();
                        }}
                      />
                    </Paper>
                    {message.sender === 'user' && user && (
                      <ListItemAvatar sx={{ minWidth: 40, ml: 1 }}>
                        <Avatar 
                          alt={user.displayName || 'User'} 
                          src={user.photoURL || undefined} 
                          sx={{ width: 32, height: 32 }}
                        />
                      </ListItemAvatar>
                    )}
                  </ListItem>
                </motion.div>
              ))}
              
              
              {(isLoading || isTyping) && (
                <ListItem sx={{ justifyContent: 'flex-start' }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>AI</Avatar>
                  </ListItemAvatar>
                  <Paper elevation={2} sx={{ p: 2, borderRadius: '18px 18px 18px 4px' }}>
                    <CircularProgress size={24} />
                  </Paper>
                </ListItem>
              )}
              
              {error && (
                <Alert severity="error" sx={{ my: 2 }}>
                  {error}
                </Alert>
              )}
              
              <div ref={messagesEndRef} />
            </List>
          </Box>
          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{ 
              p: 2, 
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask about your travel plans..."
                value={inputValue} // Use local state for value
                onChange={(e) => setInputValue(e.target.value)} // Update local state on change
                disabled={isLoading}
                sx={{ mr: 1 }}
                inputRef={inputRef}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading || !inputValue.trim()}
                sx={{ minWidth: 56, height: 56 }}
              >
                <SendIcon />
              </Button>
            </Box>
          </Box>
        </Box>
      </Main>
    </Box>
    
  );
};

export default ChatWindow;