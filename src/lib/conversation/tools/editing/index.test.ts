import { describe, expect, it, vi } from 'vitest';
import { editingTools } from './index';
import { EditorIntent } from '@/types/conversation';

// Mock necessary types and functions
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('./runRewriteTool', () => ({
  runRewriteTool: vi.fn()
}));

vi.mock('./runShortenTool', () => ({
  runShortenTool: vi.fn()
}));

vi.mock('./runExpandTool', () => ({
  runExpandTool: vi.fn()
}));

vi.mock('./runFixGrammarTool', () => ({
  runFixGrammarTool: vi.fn()
}));

vi.mock('./runChangeToneTool', () => ({
  runChangeToneTool: vi.fn()
}));

vi.mock('./runAddSectionTool', () => ({
  runAddSectionTool: vi.fn()
}));

vi.mock('./runRemoveSectionTool', () => ({
  runRemoveSectionTool: vi.fn()
}));

vi.mock('./runFindAndReplaceTool', () => ({
  runFindAndReplaceTool: vi.fn()
}));

vi.mock('./runSeoAnalysisTool', () => ({
  runSeoAnalysisTool: vi.fn()
}));

vi.mock('./runPortalCheckTool', () => ({
  runPortalCheckTool: vi.fn()
}));

vi.mock('./runReorderSectionsTool', () => ({
  runReorderSectionsTool: vi.fn()
}));

vi.mock('./runFactCheckTool', () => ({
  runFactCheckTool: vi.fn()
}));

vi.mock('./runReadabilityAnalysisTool', () => ({
  runReadabilityAnalysisTool: vi.fn()
}));

vi.mock('./runFormatConsistencyTool', () => ({
  runFormatConsistencyTool: vi.fn()
}));

describe('Editing Tools Registry', () => {
  it('should export all editing tools by their registry keys', () => {
    const availableTools = Object.keys(editingTools);

    expect(availableTools).toContain('REWRITE_SECTION');
    expect(availableTools).toContain('SHORTEN_SECTION');
    expect(availableTools).toContain('EXPAND_SECTION');
    expect(availableTools).toContain('FIX_GRAMMAR');
    expect(availableTools).toContain('CHANGE_TONE');
    expect(availableTools).toContain('ADD_SECTION');
    expect(availableTools).toContain('REMOVE_SECTION');
    expect(availableTools).toContain('FIND_AND_REPLACE');
    expect(availableTools).toContain('RUN_SEO_ANALYSIS');
    expect(availableTools).toContain('RUN_PORTAL_CHECK');
    expect(availableTools).toContain('REORDER_SECTIONS');
    expect(availableTools).toContain('FACT_CHECK');
    expect(availableTools).toContain('READABILITY_ANALYSIS');
    expect(availableTools).toContain('FORMAT_CONSISTENCY');

    availableTools.forEach(toolKey => {
      expect(typeof editingTools[toolKey]).toBe('function');
    });
  });

  it('should have exactly 15 editing tools registered', () => {
    expect(Object.keys(editingTools)).toHaveLength(15);
  });

  it('should not have any undefined or null tools', () => {
    Object.values(editingTools).forEach(tool => {
      expect(tool).toBeDefined();
      expect(tool).not.toBeNull();
      expect(typeof tool).toBe('function');
    });
  });

  it('should contain all basic text editing tools', () => {
    const basicTools = [
      'REWRITE_SECTION',
      'SHORTEN_SECTION',
      'EXPAND_SECTION',
      'FIX_GRAMMAR',
      'CHANGE_TONE',
    ];

    basicTools.forEach(tool => {
      expect(editingTools).toHaveProperty(tool);
    });
  });

  it('should contain advanced editing tools', () => {
    const advancedTools = [
      'ADD_SECTION',
      'REMOVE_SECTION',
      'FIND_AND_REPLACE',
      'REORDER_SECTIONS',
    ];

    advancedTools.forEach(tool => {
      expect(editingTools).toHaveProperty(tool);
    });
  });

  it('should contain quality assurance tools', () => {
    const qaTools = [
      'RUN_SEO_ANALYSIS',
      'RUN_PORTAL_CHECK',
      'FACT_CHECK',
      'READABILITY_ANALYSIS',
      'FORMAT_CONSISTENCY',
    ];

    qaTools.forEach(tool => {
      expect(editingTools).toHaveProperty(tool);
    });
  });
});
