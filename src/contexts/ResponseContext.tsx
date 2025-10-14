import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Response {
  question_id: string;
  response_value: string;
  module_name: string;
}

interface ResponseContextType {
  responses: Response[];
  getModuleResponses: (moduleName: string) => Record<string, string>;
  updateResponse: (moduleName: string, questionId: string, value: string) => void;
  saveResponses: (moduleName: string, responsesToSave: Record<string, string>) => Promise<boolean>;
  isLoading: boolean;
  refreshResponses: () => Promise<void>;
}

const ResponseContext = createContext<ResponseContextType | undefined>(undefined);

export function useResponses() {
  const context = useContext(ResponseContext);
  if (context === undefined) {
    throw new Error('useResponses must be used within a ResponseProvider');
  }
  return context;
}

interface ResponseProviderProps {
  children: ReactNode;
}

export function ResponseProvider({ children }: ResponseProviderProps) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAllResponses = async () => {
    setIsLoading(true);
    try {
      // Get session first (faster than getUser)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_responses')
        .select('question_id, response_value, module_name')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error loading responses:', error);
      } else {
        setResponses(data || []);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshResponses = async () => {
    await loadAllResponses();
  };

  useEffect(() => {
    // Load responses in background without blocking UI
    setTimeout(() => loadAllResponses(), 0);
  }, []);

  const getModuleResponses = (moduleName: string): Record<string, string> => {
    const moduleResponses: Record<string, string> = {};
    responses
      .filter(r => r.module_name === moduleName)
      .forEach(r => {
        moduleResponses[r.question_id] = r.response_value || '';
      });
    return moduleResponses;
  };

  const updateResponse = (moduleName: string, questionId: string, value: string) => {
    setResponses(prev => {
      const existing = prev.find(r => r.module_name === moduleName && r.question_id === questionId);
      if (existing) {
        return prev.map(r => 
          r.module_name === moduleName && r.question_id === questionId 
            ? { ...r, response_value: value }
            : r
        );
      } else {
        return [...prev, { module_name: moduleName, question_id: questionId, response_value: value }];
      }
    });
  };

  const saveResponses = async (moduleName: string, responsesToSave: Record<string, string>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Save each response and update local state immediately
      for (const [questionId, value] of Object.entries(responsesToSave)) {
        if (!value) continue; // Skip empty responses

        const { error } = await supabase
          .from('user_responses')
          .upsert({
            user_id: user.id,
            module_name: moduleName,
            question_id: questionId,
            response_value: value,
            response_type: 'text'
          }, {
            onConflict: 'user_id,question_id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Error saving response:', error);
          return false;
        }

        // Update local state immediately instead of full refresh
        updateResponse(moduleName, questionId, value);
      }

      // Mark module as completed
      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          module_name: moduleName,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_name',
          ignoreDuplicates: false
        });

      if (progressError) {
        console.error('Error updating progress:', progressError);
      }

      // No need for full refresh - local state is already updated
      return true;
    } catch (error) {
      console.error('Error saving responses:', error);
      return false;
    }
  };

  return (
    <ResponseContext.Provider value={{
      responses,
      getModuleResponses,
      updateResponse,
      saveResponses,
      isLoading,
      refreshResponses
    }}>
      {children}
    </ResponseContext.Provider>
  );
}