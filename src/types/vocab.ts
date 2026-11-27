export interface VocabEntry {
  id: string;
  word: string;
  reading: string;
  pitch?: string;
  posZh: string;
  meaningZh: string;
  ttsText?: string;
  audioId: string;
  exampleJa: string;
  exampleZh: string;
  stageId: string;
}

export interface GrammarTip {
  id: string;
  titleZh: string;
  patternJa: string;
  summaryZh: string;
  contrastExample?: {
    goodJa: string;
    goodZh: string;
    badJa?: string;
    noteZh: string;
  };
}
