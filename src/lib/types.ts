export type Topic = {
  id: string;
  name: string;
  order: number;
};

export type Sign = {
  /** Lexikon-ID i Svenskt teckenspråkslexikon, t.ex. "00257". */
  id: string;
  word: string;
  /** Andra ord som godtas som svar i "Vad betyder tecknet?". */
  synonyms: string[];
  topicIds: string[];
  media: {
    video: string;
    poster?: string;
    /** Animationsfil för avataren (fas 4). */
    avatar?: string;
  };
  sourceUrl: string;
};

export type Catalog = {
  generatedAt: string;
  source: {
    name: string;
    url: string;
    license: string;
    licenseUrl: string;
  };
  topics: Topic[];
  signs: Sign[];
};

export type Mode = 'browse' | 'produce' | 'recognize';
