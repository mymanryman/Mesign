import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CameraMirror } from '../components/CameraMirror';
import { CatalogGate } from '../components/CatalogGate';
import { Layout } from '../components/Layout';
import { SignPlayer } from '../components/SignPlayer';
import { checkAnswer, type AnswerResult } from '../lib/answer';
import { pickSigns, shuffle, type Grade } from '../lib/progress';
import { signsForTopics, useStore } from '../lib/store';
import type { Catalog, Mode, Sign } from '../lib/types';

type PracticeMode = Exclude<Mode, 'browse'>;
type Outcome = { sign: Sign; grade: Grade };

const TITLES: Record<PracticeMode, string> = {
  produce: 'Teckna själv',
  recognize: 'Vad betyder tecknet?',
};

export function Practice({ mode }: { mode: PracticeMode }) {
  const [round, setRound] = useState(0);
  return (
    <Layout title={TITLES[mode]}>
      <CatalogGate>{(catalog) => <Session key={round} catalog={catalog} mode={mode} onRestart={() => setRound((r) => r + 1)} />}</CatalogGate>
    </Layout>
  );
}

function Session({ catalog, mode, onRestart }: { catalog: Catalog; mode: PracticeMode; onRestart: () => void }) {
  const { settings, progress, record } = useStore();
  const pool = useMemo(() => signsForTopics(catalog, settings.topicIds), [catalog, settings.topicIds]);
  // Frågorna väljs en gång per omgång, så att de inte byts ut när progressionen uppdateras.
  const questions = useMemo(() => pickSigns(pool, progress, settings.questionCount), [pool]);
  const [step, setStep] = useState(0);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  if (questions.length === 0) return <p>Inga tecken i de valda ämnena.</p>;
  if (step >= questions.length) return <Results outcomes={outcomes} onRestart={onRestart} />;

  const sign = questions[step];
  const finish = (g: Grade) => {
    record(sign.id, g, mode);
    setOutcomes((o) => [...o, { sign, grade: g }]);
    setStep((s) => s + 1);
  };

  return (
    <div className="space-y-4">
      <Progress current={step + 1} total={questions.length} />
      {mode === 'produce' ? (
        <ProduceQuestion key={sign.id} sign={sign} onDone={finish} />
      ) : (
        <RecognizeQuestion key={sign.id} sign={sign} pool={pool} allSigns={catalog.signs} multipleChoice={settings.multipleChoice} onDone={finish} />
      )}
    </div>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div>
      <p className="mb-1 text-sm text-slate-500">
        Fråga {current} av {total}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${((current - 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}

function ProduceQuestion({ sign, onDone }: { sign: Sign; onDone: (g: Grade) => void }) {
  const [revealed, setRevealed] = useState(false);
  const [camera, setCamera] = useState(false);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-slate-900">
        <p className="text-sm text-slate-500">Teckna</p>
        <p className="text-4xl font-semibold">{sign.word}</p>
      </div>
      {!revealed ? (
        <>
          {camera && <CameraMirror />}
          <button type="button" onClick={() => setCamera((c) => !c)} className="w-full rounded-xl bg-white py-3 font-medium dark:bg-slate-900">
            {camera ? 'Stäng kameran' : 'Se dig själv i kameran'}
          </button>
          <button type="button" onClick={() => setRevealed(true)} className="w-full rounded-xl bg-brand-600 py-4 text-lg font-semibold text-white active:bg-brand-700">
            Visa rätt tecken
          </button>
        </>
      ) : (
        <>
          <SignPlayer sign={sign} />
          <p className="text-center font-medium">Hur gick det?</p>
          <GradeButtons onGrade={onDone} />
        </>
      )}
    </div>
  );
}

function GradeButtons({ onGrade }: { onGrade: (g: Grade) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button type="button" onClick={() => onGrade('wrong')} className="rounded-xl bg-rose-600 py-3 font-semibold text-white">
        Fel
      </button>
      <button type="button" onClick={() => onGrade('almost')} className="rounded-xl bg-amber-500 py-3 font-semibold text-white">
        Nästan
      </button>
      <button type="button" onClick={() => onGrade('correct')} className="rounded-xl bg-emerald-600 py-3 font-semibold text-white">
        Rätt
      </button>
    </div>
  );
}

const FEEDBACK: Record<AnswerResult, { text: string; className: string }> = {
  correct: { text: 'Rätt!', className: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200' },
  typo: { text: 'Nästan rätt, kolla stavningen.', className: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' },
  wrong: { text: 'Inte riktigt.', className: 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200' },
};

const GRADE_FOR: Record<AnswerResult, Grade> = { correct: 'correct', typo: 'almost', wrong: 'wrong' };

function RecognizeQuestion({
  sign,
  pool,
  allSigns,
  multipleChoice,
  onDone,
}: {
  sign: Sign;
  pool: Sign[];
  allSigns: Sign[];
  multipleChoice: boolean;
  onDone: (g: Grade) => void;
}) {
  const { updateSettings } = useStore();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const choices = useMemo(() => buildChoices(sign, pool, allSigns), [sign, pool, allSigns]);

  const submit = (answer: string) => setResult(checkAnswer(answer, sign.word, sign.synonyms));
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  return (
    <div className="space-y-4">
      <SignPlayer sign={sign} />
      {result === null ? (
        multipleChoice ? (
          <div className="grid grid-cols-2 gap-2">
            {choices.map((word) => (
              <button key={word} type="button" onClick={() => submit(word)} className="rounded-xl bg-white py-4 text-lg font-medium dark:bg-slate-900">
                {word}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-2">
            <label htmlFor="answer" className="block font-medium">
              Vad betyder tecknet?
            </label>
            <input
              id="answer"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg dark:border-slate-700 dark:bg-slate-900"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setResult('wrong')} className="flex-1 rounded-xl bg-white py-3 font-medium dark:bg-slate-900">
                Vet inte
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white">
                Svara
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 ${FEEDBACK[result].className}`} role="status">
            <p className="font-semibold">{FEEDBACK[result].text}</p>
            <p>
              Tecknet betyder <strong>{sign.word}</strong>.
            </p>
          </div>
          <button type="button" onClick={() => onDone(GRADE_FOR[result])} className="w-full rounded-xl bg-brand-600 py-4 text-lg font-semibold text-white" autoFocus>
            Nästa
          </button>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <input type="checkbox" checked={multipleChoice} onChange={(e) => updateSettings({ multipleChoice: e.target.checked })} />
        Välj bland fyra alternativ i stället för att skriva
      </label>
    </div>
  );
}

/** Rätt ord plus tre andra ord, helst från samma ämnen. */
export function buildChoices(sign: Sign, pool: Sign[], allSigns: Sign[], random = Math.random): string[] {
  const others: string[] = [];
  for (const source of [shuffle(pool, random), shuffle(allSigns, random)]) {
    for (const s of source) {
      if (others.length === 3) break;
      if (s.word !== sign.word && !others.includes(s.word)) others.push(s.word);
    }
  }
  return shuffle([sign.word, ...others], random);
}

function Results({ outcomes, onRestart }: { outcomes: Outcome[]; onRestart: () => void }) {
  const right = outcomes.filter((o) => o.grade === 'correct').length;
  const missed = outcomes.filter((o) => o.grade !== 'correct');
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-slate-900">
        <p className="text-sm text-slate-500">Resultat</p>
        <p className="text-4xl font-semibold">
          {right} av {outcomes.length}
        </p>
      </div>
      {missed.length > 0 && (
        <div>
          <p className="mb-2 font-medium">Öva mer på</p>
          <ul className="flex flex-wrap gap-2">
            {missed.map((o) => (
              <li key={o.sign.id} className="rounded-full bg-white px-3 py-1 text-sm dark:bg-slate-900">
                {o.sign.word}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" onClick={onRestart} className="w-full rounded-xl bg-brand-600 py-4 text-lg font-semibold text-white">
        Öva igen
      </button>
      <Link to="/" className="block w-full rounded-xl bg-white py-3 text-center font-medium dark:bg-slate-900">
        Till start
      </Link>
    </div>
  );
}
