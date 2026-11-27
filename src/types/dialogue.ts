export interface RubyToken {
  text: string;
  reading?: string;
  vocabId?: string;
}

export type NpcExpression = 'neutral' | 'smile' | 'thinking' | 'surprised' | 'happy';

export interface ChoiceOption {
  id: string;
  tokens: RubyToken[];
  correct: boolean;
  feedbackZh: string;
  nextNodeId?: string;
  wrongVocabIds?: string[];
}

export interface ClauseBlock {
  id: string;
  tokens: RubyToken[];
  isDistractor?: boolean;
}

export interface ClozeChoice {
  text: string;
  reading?: string;
  correct: boolean;
  explanationZh: string;
}

export type Challenge =
  | {
      type: 'choice';
      promptZh: string;
      options: ChoiceOption[];
    }
  | {
      type: 'clause-builder';
      promptZh: string;
      correctOrder: string[];
      blocks: ClauseBlock[];
      grammarTipId: string;
      targetVocabIds?: string[];
      feedbackSuccessZh: string;
      feedbackWrongZh: string;
    }
  | {
      type: 'cloze';
      promptZh: string;
      beforeTokens: RubyToken[];
      afterTokens: RubyToken[];
      choices: ClozeChoice[];
      grammarTipId: string;
      targetVocabIds?: string[];
    };

export interface DialogueNode {
  id: string;
  speaker: string;
  speakerVoice: 'nanami' | 'keita';
  expression: NpcExpression;
  npcTokens: RubyToken[];
  npcZh: string;
  ttsText?: string;
  audioId: string;
  challenge?: Challenge;
  nextNodeId?: string;
  isEnd?: boolean;
}

export type SceneTheme = 'hotel' | 'drugstore' | 'station';
export type NpcAvatar = 'hotel-staff' | 'drugstore-staff' | 'commuter';

export interface Scenario {
  id: string;
  order: number;
  titleJa: string;
  titleZh: string;
  subtitleZh: string;
  locationTag: string;
  sceneTheme: SceneTheme;
  npcName: string;
  npcRoleZh: string;
  npcAvatar: NpcAvatar;
  grammarFocus: string[];
  startNodeId: string;
  nodes: DialogueNode[];
}
