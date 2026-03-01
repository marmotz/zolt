#!/usr/bin/env node

import { main } from './cli';

export * from './cli/index';

if (import.meta.main) {
  main();
}
