import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

interface ConversationContextType {
  messages: Message[];
  currentAgent: string | null;
  isActive: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setAgent: (agentId: string) => void;
  startConversation: () => void;
  endConversation: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

interface ConversationProviderProps {
  children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const setAgent = (agentId: string) => {
    setCurrentAgent(agentId);
  };

  const startConversation = () => {
    setIsActive(true);
  };

  const endConversation = () => {
    setIsActive(false);
  };

  const value = {
    messages,
    currentAgent,
    isActive,
    addMessage,
    clearMessages,
    setAgent,
    startConversation,
    endConversation
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};