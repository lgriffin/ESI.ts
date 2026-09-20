import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import EndpointExplorer from './components/EndpointExplorer.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('EndpointExplorer', EndpointExplorer);
  },
} satisfies Theme;
