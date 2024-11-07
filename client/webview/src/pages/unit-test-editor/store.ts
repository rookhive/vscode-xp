import { proxy, useSnapshot } from 'valtio';
import { RuleType } from '~/types';

export type State = {
  ruleType: RuleType;
  inputText: string;
  expectationText: string;
  resultText: string;
  isTestExecuting: boolean;
  isEditorValid: boolean;
};

export const state = proxy<State>({
  ruleType: 'correlation',
  inputText: '',
  expectationText: '',
  resultText: '',
  isTestExecuting: false,
  get isEditorValid(): boolean {
    return !!state.inputText;
  }
});

export const actions = {
  setRuleType(ruleType: RuleType) {
    state.ruleType = ruleType;
  },
  setInputText(inputText: string) {
    state.inputText = inputText;
  },
  setExpectationText(expectationText: string) {
    state.expectationText = expectationText;
  },
  setResultText(resultText: string) {
    state.resultText = resultText;
  }
};

export const useActions = () => actions;
export const useEditor = () => useSnapshot(state);
