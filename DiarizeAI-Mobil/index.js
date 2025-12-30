import { registerRootComponent } from 'expo';

import App from './App'; // (Burada ./src/index veya başka bir şey yazmamalı!)

// registerRootComponent calls AppRegistry.registerComponent(...) behind the scenes
registerRootComponent(App);