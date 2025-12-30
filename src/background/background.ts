import {
  OWGames,
  OWGameListener,
  OWWindow
} from '@overwolf/overwolf-api-ts';

import { kWindowNames, kGameClassIds } from "../consts";
import { supabase } from '../config/supabase';
import { Quest, World } from '../types';

import RunningGameInfo = overwolf.games.RunningGameInfo;

class BackgroundController {
  private static _instance: BackgroundController;
  private _windows: Record<string, OWWindow> = {};
  private _gameListener: OWGameListener;

  private _worldsCache: World[];
  private _questsCache: Quest[];

  private constructor() {
    // Create window reference
    this._windows[kWindowNames.inGame] = new OWWindow(kWindowNames.inGame);

    // Listen for game start/stop
    this._gameListener = new OWGameListener({
      onGameStarted: this.toggleWindows.bind(this),
      onGameEnded: this.toggleWindows.bind(this)
    });

    this.loadGameData();

    // overwolf.extensions.onAppLaunchTriggered.addListener(
    //   e => this.onAppLaunchTriggered(e)
    // );
  };

  public static instance(): BackgroundController {
    if (!BackgroundController._instance) {
      BackgroundController._instance = new BackgroundController();
    }
    return BackgroundController._instance;
  }

  public async run() {
    this._gameListener.start();

    if (await this.isSupportedGameRunning())
      this._windows[kWindowNames.inGame].restore();
  }

  private toggleWindows(info: RunningGameInfo) {
    if (!info || !this.isSupportedGame(info)) {
      return;
    }

    if (info.isRunning) {
      // this._windows[kWindowNames.desktop].close();
      this._windows[kWindowNames.inGame].restore();
    } else {
      // this._windows[kWindowNames.desktop].restore();
      this._windows[kWindowNames.inGame].close();
    }
  }

  private async isSupportedGameRunning(): Promise<boolean> {
    const info = await OWGames.getRunningGameInfo();
    console.log("in isSupportedGameRunning: ", info);

    return info && info.isRunning && this.isSupportedGame(info);
  }

  // Identify whether the RunningGameInfo object we have references a supported game
  private isSupportedGame(info: RunningGameInfo) {
    return kGameClassIds.includes(info.classId);
  }

  // Supabase Data Loading
  private async loadGameData() {
    try {
      const cachedVersion = localStorage.getItem('overlay_data_version');

      const { data: currentVersion } = await supabase
        .from('app_metadata')
        .select('value')
        .eq('key', 'overlay_data_version')
        .single();

      if (cachedVersion !== currentVersion?.value) {
        console.log('Fetching fresh data from Supabase...');
        await this.refreshGameData(currentVersion.value);
      } else {
        console.log('Using cached data');
        this.loadFromCache();
      }
    } catch (error) {
      console.log('Error loading game data: ', error);
    }
  }

  private async refreshGameData(version: string) {
    try {
      const [worldsResult, questsResult] = await Promise.all([
        supabase.from('worlds').select('*'),
        supabase.from('story_quests').select('*')
      ]);

      console.log('results: ', {worldsResult, questsResult})

      this._worldsCache = worldsResult.data || [];
      this._questsCache = questsResult.data || [];

      localStorage.setItem('worlds', JSON.stringify(this._worldsCache));
      localStorage.setItem('quests', JSON.stringify(this._questsCache));
      localStorage.setItem('overlay_data_version', version);

      console.log(`Cached ${this._worldsCache.length} worlds and ${this._questsCache} quests`);
    } catch (error) {
      console.error('Error refreshing game data: ', error);
    }
  }

  private loadFromCache() {
    this._worldsCache = JSON.parse(localStorage.getItem('worlds') || '[]');
    this._questsCache = JSON.parse(localStorage.getItem('quests') || '[]');

    console.log(`Loaded ${this._worldsCache.length} worlds and ${this._questsCache.length} quests`);
  }
}

BackgroundController.instance().run();
