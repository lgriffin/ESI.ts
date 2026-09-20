import {
  renderHelp,
  loadScripts,
  renderRepoHelp,
} from '../../../scripts/npm-help';

describe('npm-help', () => {
  describe('renderHelp (pure)', () => {
    const scripts = {
      build: 'tsup',
      typecheck: 'tsc --noEmit',
      lint: 'eslint src',
      test: 'jest',
      coverage: 'jest --coverage',
      docs: 'typedoc',
      'example:status': 'ts-node examples/status.ts',
      'example:wallet': 'ts-node examples/wallet.ts',
      'example:market': 'ts-node examples/market.ts',
      'bdd:alliance': 'jest alliance',
      'bdd:wallet': 'jest wallet',
      'token:create': 'ts-node scripts/create-token.ts',
      'contract:live': 'jest contract',
    };

    it('lists described scripts in the overview with their hints', () => {
      const out = renderHelp(scripts);
      expect(out).toContain('ESI.ts — npm commands');
      expect(out).toContain('npm run build');
      expect(out).toContain('Compile the library');
    });

    it('groups the example: family and keeps the long list compact', () => {
      const out = renderHelp(scripts);
      expect(out).toContain('example');
      expect(out).toContain('npm run example:status');
      expect(out).toContain('npm run example:wallet');
      expect(out).toContain('npm run example:market');
    });

    it('groups the bdd: family', () => {
      const out = renderHelp(scripts);
      expect(out).toContain('npm run bdd:alliance');
      expect(out).toContain('npm run bdd:wallet');
    });

    it('matches a keyword across the whole name list', () => {
      const out = renderHelp(scripts, 'wallet');
      expect(out).toContain('match');
      expect(out).toContain('npm run example:wallet');
      expect(out).toContain('npm run bdd:wallet');
      // Should not leak an unrelated example
      expect(out).not.toContain('npm run example:market');
    });

    it('is case-insensitive about the keyword', () => {
      const out = renderHelp(scripts, 'WALLET');
      expect(out).toContain('npm run example:wallet');
    });

    it('reports no matches for a keyword that matches nothing', () => {
      const out = renderHelp(scripts, 'qqqqqq');
      expect(out).toContain('No scripts match');
    });

    it('treats an empty keyword as an overview request', () => {
      const out = renderHelp(scripts, '   ');
      expect(out).toContain('top-level & most-asked scripts');
    });

    it('lists every known script at least once', () => {
      const out = renderHelp(scripts);
      for (const name of Object.keys(scripts)) {
        expect(out).toContain(`npm run ${name}`);
      }
    });
  });

  describe('loadScripts / renderRepoHelp (repo)', () => {
    it('reads real scripts from package.json', () => {
      const scripts = loadScripts();
      expect(scripts['build']).toBeDefined();
      expect(scripts['test']).toBeDefined();
      expect(scripts['help']).toBeDefined();
    });

    it('renders the full repo help with the example and bdd families', () => {
      const out = renderRepoHelp();
      expect(out).toContain('example —');
      expect(out).toContain('bdd —');
      expect(out).toContain('npm run example:status');
    });

    it('finds a real script by keyword', () => {
      const out = renderRepoHelp('wallet');
      expect(out).toContain('npm run example:wallet');
    });
  });
});
