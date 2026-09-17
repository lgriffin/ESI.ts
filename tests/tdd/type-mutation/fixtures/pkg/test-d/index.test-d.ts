import { expectType } from 'tsd';
import type { Widget } from '../types';

declare const widget: Widget;
expectType<number>(widget.id);
