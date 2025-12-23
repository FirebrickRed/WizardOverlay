import { OWWindow } from "@overwolf/overwolf-api-ts";

// A base class for the app's foreground windows.
// Sets the modal and drag behaviors, which are shared accross the desktop and in-game windows.
export class AppWindow {
  protected currWindow: OWWindow;
  protected mainWindow: OWWindow;

  constructor(windowName: string) {
    this.mainWindow = new OWWindow('background');
    this.currWindow = new OWWindow(windowName);

    const quest_overlay_element = document.getElementById('quest_overlay');
    this.setDrag(quest_overlay_element);
    
    const closeButton = document.getElementById('closeButton');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.currWindow.minimize();
      })
    }
  }

  public async getWindowState() {
    return await this.currWindow.getWindowState();
  }

  private async setDrag(elem) {
    this.currWindow.dragMove(elem);
  }
}
