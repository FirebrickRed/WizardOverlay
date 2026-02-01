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
    this._windows[kWindowNames.desktop] = new OWWindow(kWindowNames.desktop);

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

    const currWindowName = (await this.isSupportedGameRunning()) ? kWindowNames.inGame : kWindowNames.desktop;

    this._windows[currWindowName].restore();
  }

  private toggleWindows(info: RunningGameInfo) {
    if (!info || !this.isSupportedGame(info)) {
      return;
    }

    if (info.isRunning) {
      this._windows[kWindowNames.desktop].close();
      this._windows[kWindowNames.inGame].restore();
    } else {
      this._windows[kWindowNames.desktop].restore();
      this._windows[kWindowNames.inGame].close();
    }
  }

  private async isSupportedGameRunning(): Promise<boolean> {
    const info = await OWGames.getRunningGameInfo();

    return info && info.isRunning && this.isSupportedGame(info);
  }

  // Identify whether the RunningGameInfo object we have references a supported game
  private isSupportedGame(info: RunningGameInfo) {
    return kGameClassIds.includes(info.classId);
  }

  // Supabase Data Loading
  private async loadGameData() {
    try {
      const cachedVersion = Number(localStorage.getItem('overlay_data_version'));

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
      const { data: worldsResult, error: worldsError } = await supabase.from('worlds')
        .select('*')
        .order('story_order', { ascending: true });

      if (worldsError) {
        console.error('Error fetching worlds:', worldsError);
        return;
      }
      
      let questLength = 0;
      const worldsWithQuests = await Promise.all(
        worldsResult.map(async (world) => {
          const { data: quests, error: questsError } = await supabase
            .from('story_quests')
            .select('*')
            .eq('world_slug', world.slug)
            .order('story_order', { ascending: true });

          questLength += quests.length;
          if (questsError) {
            console.error(`Error fetching quests for ${world.slug}:`, questsError);
            return {
              ...world,
              quests: []
            };
          }

          return {
            ...world,
            quests: quests || []
          }
        })
      );

      this._worldsCache = worldsWithQuests;

      localStorage.setItem('worlds', JSON.stringify(this._worldsCache));
      localStorage.setItem('overlay_data_version', version);

      console.log(`Cached ${this._worldsCache.length} worlds and ${questLength} quests`);
    } catch (error) {
      console.error('Error refreshing game data: ', error);
    }
  }

  private loadFromCache() {
    this._worldsCache = JSON.parse(localStorage.getItem('worlds') || '[]');

    console.log(`Loaded ${this._worldsCache.length} worlds`);
  }
}

BackgroundController.instance().run();
