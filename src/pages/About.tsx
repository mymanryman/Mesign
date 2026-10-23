import { Layout } from '../components/Layout';
import { useStore } from '../lib/store';

export function About() {
  const { catalog, resetProgress } = useStore();
  const generatedAt = catalog.status === 'ready' ? catalog.catalog.generatedAt : null;
  return (
    <Layout title="Om Mesign">
      <div className="space-y-4 leading-relaxed">
        <p>Mesign är en gratis app för att träna svenskt teckenspråk. Din progression sparas bara i den här webbläsaren.</p>
        <h2 className="text-lg font-semibold">Källa och licens</h2>
        <p>
          Alla tecken kommer från{' '}
          <a className="underline" href="https://teckensprakslexikon.su.se/">
            Svenskt teckenspråkslexikon
          </a>{' '}
          vid Stockholms universitet och används enligt licensen{' '}
          <a className="underline" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.sv">
            CC BY-NC-SA 4.0
          </a>
          . Videorna är inte ändrade. Mesign är icke-kommersiell och delas under samma licens.
        </p>
        {generatedAt && <p className="text-sm text-slate-500">Tecknen hämtades {new Date(generatedAt).toLocaleDateString('sv-SE')}.</p>}
        <h2 className="text-lg font-semibold">Börja om</h2>
        <button
          type="button"
          onClick={() => {
            if (confirm('Vill du nollställa all din progression?')) resetProgress();
          }}
          className="rounded-xl bg-white px-4 py-3 font-medium text-rose-700 dark:bg-slate-900"
        >
          Nollställ progression
        </button>
      </div>
    </Layout>
  );
}
