import { AppWindow } from "../AppWindow";
import '../css/ingame.css';
import { kWindowNames } from "../consts";

import { Quest, World } from "../types";

// The window displayed in-game while a game is running.
class InGame extends AppWindow {
  private static _instance: InGame;

  private _quest_overlay_element: HTMLElement;

  private _selected_world_img_element: HTMLImageElement;
  private _selected_world_text_element: HTMLElement;
  private _selected_world_button_element: HTMLButtonElement;
  private _world_options_element: HTMLElement;
  private _world_selector_container: HTMLElement;

  private _world_quest_progress: HTMLProgressElement;
  private _previous_quest_button: HTMLButtonElement;
  private _next_quest_button: HTMLButtonElement;
  private _quest_name_element: HTMLElement;
  private _current_quest_number_element: HTMLElement;
  private _total_quest_number_element: HTMLElement;

  private _nav_element: HTMLElement;

  private _worldData: World[];
  private _selected_world: World;
  private _story_quests: Quest[];
  private _selected_quest_number: number;

  private _isWorldSelectorOpen: boolean = false;

  private readonly ICON_SIZE = 40;
  private readonly SELECTED_SIZE = 48;
  private readonly ARC_GAP = 4;

  private constructor() {
    super(kWindowNames.inGame);

    this._worldData = JSON.parse(localStorage.getItem('worldData'));

    this._quest_overlay_element = document.getElementById('quest_overlay');

    this._selected_world_img_element = document.getElementById('selected_world_img') as HTMLImageElement;
    this._selected_world_text_element = document.getElementById('selected_world_text');
    this._selected_world_button_element = document.getElementById('selected_world') as HTMLButtonElement;
    this._world_options_element = document.getElementById('world_options')
    this._world_selector_container = document.getElementById('world_selector_container');
    
    this._world_quest_progress = document.getElementById('world_quest_progress') as HTMLProgressElement;
    this._previous_quest_button = document.getElementById('previous_quest_button') as HTMLButtonElement;
    this._next_quest_button = document.getElementById('next_quest_button') as HTMLButtonElement;
    this._quest_name_element = document.getElementById('quest_name');
    this._current_quest_number_element = document.getElementById('current_quest_number');
    this._total_quest_number_element = document.getElementById('total_quest_number');

    this._nav_element = document.getElementById('nav');
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new InGame();
    }

    return this._instance;
  }

  private calculateArcPositions(totalIcons: number): Array<{x: number, y: number, row: number}> {
    const positions: Array<{x: number, y: number, row: number}> = [];

    const originX = this.SELECTED_SIZE / 2 + 15;
    const originY = this.SELECTED_SIZE;

    const arcRows = [
      { radius: this.ICON_SIZE / 2 + this.ARC_GAP + 4, maxIcons: 2 },
      { radius: this.ICON_SIZE * 1.5 + this.ARC_GAP * 2 + 4, maxIcons: 3 },
      { radius: this.ICON_SIZE * 2.5 + this.ARC_GAP * 3 + 4, maxIcons: 5},
      { radius: this.ICON_SIZE * 3.5 + this.ARC_GAP * 4 + 4, maxIcons: 6},
      { radius: this.ICON_SIZE * 4.5 + this.ARC_GAP * 5 + 4, maxIcons: 6},
    ];

    let iconIndex = 0;

    for (let rowNum = 0; rowNum < arcRows.length; rowNum++) {
      if (iconIndex >= totalIcons) break;

      const row = arcRows[rowNum];
      const iconsInThisRow = Math.min(row.maxIcons, totalIcons - iconIndex);

      for (let i = 0; i < iconsInThisRow; i++) {
        const t = iconsInThisRow > 1 ? i / (iconsInThisRow - 1) : 0.5;
        const angle = t * (Math.PI / 2);

        const x = originX + Math.cos(angle) * row.radius - this.ICON_SIZE / 2;
        const y = originY + Math.sin(angle) * row.radius - this.ICON_SIZE / 2;

        positions.push({ x, y, row: rowNum, });
        iconIndex++;
      }
    }
    return positions;
  }

  private buildWorldOptions(): void {
    this._world_options_element.innerHTML = '';

    const selectedIndex = this._worldData.findIndex(w => w.world_id === this._selected_world.world_id);
    const otherWorlds = [
      ...this._worldData.slice(0 , selectedIndex),
      ...this._worldData.slice(selectedIndex + 1)
    ];

    otherWorlds.forEach((world: World) => {
      const button = document.createElement('button');
      button.className = 'world_card world_option';

      const img = document.createElement('img');
      img.src = `./img/world/${world.world_id}.png`;
      img.alt = world.display_name;

      const text = document.createElement('p');
      text.textContent = world.display_name;

      button.appendChild(img);
      button.appendChild(text);

      button.addEventListener('click', event => {
        event.stopPropagation();
        this.selectWorld(world.world_id);
      });

      this._world_options_element.appendChild(button);
    });
  }

  /**
   * Toggles the world selector open/closed
   */
  private openWorldSelector(): void {
    this._isWorldSelectorOpen = true;
    this._world_selector_container.classList.add('open');
    this._selected_world_button_element.classList.add('active');
    this._quest_overlay_element.classList.add('open');
    this._nav_element.classList.add('open');
    this._quest_name_element.classList.add('open');

    const options = this._world_options_element.querySelectorAll('.world_option') as NodeListOf<HTMLElement>;
    const positions = this.calculateArcPositions(options.length);

    options.forEach((option, i) => {
      const pos = positions[i];
      const delay = pos.row * 0.06 + (i % 5) * 0.02;

      option.style.transitionDelay = `${delay}s`;
      option.style.left = `${pos.x}px`;
      option.style.top = `${pos.y}px`;
      option.style.transform = 'scale(1)';
      option.style.opacity = '1';
    });
  }

  /**
   * Closes the world selector
   */
  private closeWorldSelector(): void {
    this._isWorldSelectorOpen = false;
    this._world_selector_container.classList.remove('open');
    this._selected_world_button_element.classList.remove('active');
    this._quest_overlay_element.classList.remove('open');
    this._nav_element.classList.remove('open');
    this._quest_name_element.classList.remove('open');
    
    const options = this._world_options_element.querySelectorAll('.world_option') as NodeListOf<HTMLElement>;
    options.forEach((option: HTMLElement) => {
      option.style.transitionDelay = '0s';
      option.style.left = `${this.SELECTED_SIZE / 2 - this.ICON_SIZE / 2}px`;
      option.style.top = `${this.SELECTED_SIZE}px`;
      option.style.transform = 'scale(0)';
      option.style.opacity = '0';
    });
  }

  private toggleWorldSelector() {
    if (this._isWorldSelectorOpen) {
      this.closeWorldSelector();
    } else {
      this.openWorldSelector();
    }
  }

  /**
   * Selects a world and updates the UI
   */
  private selectWorld(worldId: string): void {
    this.closeWorldSelector();
    this.loadWorld(worldId, 0);
    localStorage.setItem('selectedWorld', worldId);
  }

  public async run() {

    if (this._selected_world_button_element) {
      console.log(this._worldData);

      // Get saved World (or default)
      const savedWorld = localStorage.getItem('selectedWorld');
      const initialWorld = savedWorld || this._worldData[0]?.world_id;
      const savedQuestNumber = localStorage.getItem('selectedQuestNumber');

      if (initialWorld) {
        this.loadWorld(initialWorld, savedQuestNumber ? parseInt(savedQuestNumber, 10) : 0);
      }

      this._selected_world_button_element.addEventListener('click', event => {
        event.stopPropagation();
        this.toggleWorldSelector();
      });

      document.addEventListener('click', event => {
        const target = event.target as HTMLElement;
        if (this._isWorldSelectorOpen && !this._world_selector_container.contains(target)) {
          this.closeWorldSelector();
        }
      });

      // Get Saved Quest Number (or default)
      if (savedQuestNumber) {
        this._selected_quest_number = parseInt(savedQuestNumber, 10);
        this.updateQuest();
      }

      this._previous_quest_button.addEventListener('click', () => {
        this._selected_quest_number -= 1;
        this.updateQuest();
      });

      this._next_quest_button.addEventListener('click', () => {
        this._selected_quest_number += 1;
        this.updateQuest();
      });
    }
  }

  private updateQuest() {
    this._previous_quest_button.disabled = this._selected_quest_number <= 0;
    this._next_quest_button.disabled = this._selected_quest_number >= this._world_quest_progress.max;
    this._quest_name_element.textContent = this._story_quests[this._selected_quest_number].display_name;
    this._world_quest_progress.value = this._selected_quest_number;
    this._current_quest_number_element.textContent = `${this._selected_quest_number}`;
    localStorage.setItem('selectedQuestNumber', String(this._selected_quest_number));
  }

  private loadWorld(worldId: string, startingQuestNumber: number = 0) {
    this._selected_world = this._worldData.find(world => world.world_id === worldId);

    this._selected_world_text_element.textContent = this._selected_world.display_name;
    this._selected_world_img_element.src = `./img/world/${this._selected_world.world_id}.png`;

    this._story_quests = this._selected_world.story_quests;
    this._world_quest_progress.max = this._story_quests.length - 1;
    this._selected_quest_number = startingQuestNumber;
    this._total_quest_number_element.textContent = `${this._story_quests.length -1}`;
    this.updateQuest();

    if (this._world_options_element) {
      this.buildWorldOptions();
    }
  }
}

InGame.instance().run();
