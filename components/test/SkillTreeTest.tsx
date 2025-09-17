'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabase';

const TestContainer = styled.div`
  background: #1a1a1a;
  border: 2px solid #00ffff;
  border-radius: 8px;
  padding: 20px;
  margin: 20px;
  color: white;
`;

const TestButton = styled.button`
  background: #00ffff;
  color: #000;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
  font-weight: bold;

  &:hover {
    background: #00cccc;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const TestResult = styled.div`
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 10px;
  margin: 10px 0;
  font-family: monospace;
  white-space: pre-wrap;
`;

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export default function SkillTreeTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [characterId, setCharacterId] = useState<string>('');
  const [newLevel, setNewLevel] = useState<number>(2);

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const testSkillPointCalculation = async () => {
    try {
      if (!supabase) {
        addResult({
          success: false,
          message: 'Supabase not configured'
        });
        return;
      }

      // Test the calculate_skill_points function
      const { data, error } = await supabase.rpc('calculate_skill_points', {
        character_level: 5
      });

      if (error) {
        addResult({
          success: false,
          message: `Error testing skill point calculation: ${error.message}`
        });
        return;
      }

      addResult({
        success: true,
        message: `Skill points for level 5: ${data} (should be 10)`,
        data: { level: 5, skillPoints: data }
      });
    } catch (error) {
      addResult({
        success: false,
        message: `Exception: ${error}`
      });
    }
  };

  const testLevelUp = async () => {
    if (!characterId) {
      addResult({
        success: false,
        message: 'Please enter a character ID'
      });
      return;
    }

    try {
      if (!supabase) {
        addResult({
          success: false,
          message: 'Supabase not configured'
        });
        return;
      }

      const { data, error } = await supabase.rpc('test_level_up_character', {
        p_character_id: characterId,
        p_new_level: newLevel
      });

      if (error) {
        addResult({
          success: false,
          message: `Error testing level up: ${error.message}`
        });
        return;
      }

      addResult({
        success: data.success,
        message: data.message,
        data: data.data
      });
    } catch (error) {
      addResult({
        success: false,
        message: `Exception: ${error}`
      });
    }
  };

  const testSkillSummary = async () => {
    if (!characterId) {
      addResult({
        success: false,
        message: 'Please enter a character ID'
      });
      return;
    }

    try {
      if (!supabase) {
        addResult({
          success: false,
          message: 'Supabase not configured'
        });
        return;
      }

      const { data, error } = await supabase.rpc('get_character_skill_summary', {
        p_character_id: characterId
      });

      if (error) {
        addResult({
          success: false,
          message: `Error getting skill summary: ${error.message}`
        });
        return;
      }

      addResult({
        success: true,
        message: 'Character skill summary retrieved',
        data: data
      });
    } catch (error) {
      addResult({
        success: false,
        message: `Exception: ${error}`
      });
    }
  };

  const testSkillUpgrade = async () => {
    if (!characterId) {
      addResult({
        success: false,
        message: 'Please enter a character ID'
      });
      return;
    }

    try {
      if (!supabase) {
        addResult({
          success: false,
          message: 'Supabase not configured'
        });
        return;
      }

      const { data, error } = await supabase.rpc('upgrade_skill', {
        p_character_id: characterId,
        p_skill_id: 'combat_basic_attack'
      });

      if (error) {
        addResult({
          success: false,
          message: `Error testing skill upgrade: ${error.message}`
        });
        return;
      }

      addResult({
        success: data.success,
        message: data.message,
        data: data
      });
    } catch (error) {
      addResult({
        success: false,
        message: `Exception: ${error}`
      });
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <TestContainer>
      <h3>Skill Tree System Test</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Character ID:
          <input
            type="text"
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
            placeholder="Enter character UUID"
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          New Level:
          <input
            type="number"
            value={newLevel}
            onChange={(e) => setNewLevel(parseInt(e.target.value) || 2)}
            min="2"
            max="100"
            style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
          />
        </label>
      </div>

      <div>
        <TestButton onClick={testSkillPointCalculation}>
          Test Skill Point Calculation
        </TestButton>
        
        <TestButton onClick={testLevelUp} disabled={!characterId}>
          Test Level Up
        </TestButton>
        
        <TestButton onClick={testSkillSummary} disabled={!characterId}>
          Get Skill Summary
        </TestButton>
        
        <TestButton onClick={testSkillUpgrade} disabled={!characterId}>
          Test Skill Upgrade
        </TestButton>
        
        <TestButton onClick={clearResults}>
          Clear Results
        </TestButton>
      </div>

      <div>
        <h4>Test Results:</h4>
        {testResults.map((result, index) => (
          <TestResult key={index} style={{ 
            borderColor: result.success ? '#00ff00' : '#ff0000',
            backgroundColor: result.success ? '#001100' : '#110000'
          }}>
            {result.success ? '✓' : '✗'} {result.message}
            {result.data && (
              <div style={{ marginTop: '10px', fontSize: '12px' }}>
                {JSON.stringify(result.data, null, 2)}
              </div>
            )}
          </TestResult>
        ))}
      </div>
    </TestContainer>
  );
}
