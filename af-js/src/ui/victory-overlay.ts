/**
 * VictoryOverlay - End game victory screen
 * 
 * Displays:
 * - Winner announcement
 * - Final scores for all players
 * - Score breakdown (colonies, tech cards, territories, bonuses)
 * - Tiebreaker information if applicable
 * - Rematch and Main Menu buttons
 */

import * as Phaser from 'phaser';
import { Player } from '../game/player';

/**
 * Player score display info
 */
interface PlayerScoreInfo {
  player: Player;
  rank: number;
  totalScore: number;
  isWinner: boolean;
  isTied: boolean;
}

/**
 * Victory overlay container
 */
export class VictoryOverlay extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private winnerText: Phaser.GameObjects.Text;
  private scoreDisplays: Phaser.GameObjects.Container[] = [];
  
  // Callbacks
  public onRematch?: () => void;
  public onMainMenu?: () => void;

  constructor(
    scene: Phaser.Scene,
    players: Player[],
    winner: Player,
    isTied: boolean = false
  ) {
    super(scene, 0, 0);

    // Create semi-transparent background overlay
    this.background = scene.add.rectangle(
      scene.cameras.main.width / 2,
      scene.cameras.main.height / 2,
      scene.cameras.main.width,
      scene.cameras.main.height,
      0x000000,
      0.85
    );
    this.add(this.background);

    // Sort players by score
    const sortedPlayers = this.sortPlayersByScore(players, winner, isTied);

    // Create winner announcement
    this.createWinnerAnnouncement(scene, sortedPlayers[0], isTied);

    // Create score displays for all players
    this.createScoreDisplays(scene, sortedPlayers);

    // Create buttons
    this.createButtons(scene);

    // Add to scene
    scene.add.existing(this);

    // Animate entrance
    this.animateEntrance(scene);
  }

  /**
   * Sort players by score and rank
   */
  private sortPlayersByScore(players: Player[], winner: Player, isTied: boolean): PlayerScoreInfo[] {
    const scores: PlayerScoreInfo[] = players.map(player => ({
      player,
      rank: 0,
      totalScore: player.victoryPoints.total,
      isWinner: player.id === winner.id || (isTied && player.victoryPoints.total === winner.victoryPoints.total),
      isTied: isTied
    }));

    // Sort by total score descending
    scores.sort((a, b) => b.totalScore - a.totalScore);

    // Assign ranks
    let currentRank = 1;
    for (let i = 0; i < scores.length; i++) {
      if (i > 0 && scores[i].totalScore < scores[i - 1].totalScore) {
        currentRank = i + 1;
      }
      scores[i].rank = currentRank;
    }

    return scores;
  }

  /**
   * Create winner announcement
   */
  private createWinnerAnnouncement(scene: Phaser.Scene, scoreInfo: PlayerScoreInfo, isTied: boolean): void {
    const centerX = scene.cameras.main.width / 2;
    const y = 80;

    // Winner text
    const winnerMessage = isTied ? 'TIE GAME!' : `${scoreInfo.player.name} WINS!`;
    
    this.winnerText = scene.add.text(centerX, y, winnerMessage, {
      fontSize: '48px',
      color: isTied ? '#ffaa00' : '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    this.winnerText.setOrigin(0.5, 0.5);
    this.add(this.winnerText);

    // Victory points subtitle
    const vpText = scene.add.text(
      centerX,
      y + 50,
      `${scoreInfo.totalScore} Victory Points`,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    vpText.setOrigin(0.5, 0.5);
    this.add(vpText);

    // Decorative stars
    const starPositions = [
      { x: centerX - 200, y: y },
      { x: centerX + 200, y: y }
    ];

    starPositions.forEach(pos => {
      const star = scene.add.text(pos.x, pos.y, '★', {
        fontSize: '48px',
        color: '#ffff00'
      });
      star.setOrigin(0.5, 0.5);
      this.add(star);

      // Twinkle animation
      scene.tweens.add({
        targets: star,
        alpha: 0.3,
        scale: 0.8,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  /**
   * Create score displays for all players
   */
  private createScoreDisplays(scene: Phaser.Scene, sortedScores: PlayerScoreInfo[]): void {
    const startY = 180;
    const spacing = 120;
    const centerX = scene.cameras.main.width / 2;

    sortedScores.forEach((scoreInfo, index) => {
      const y = startY + (index * spacing);
      const scoreDisplay = this.createPlayerScoreDisplay(scene, scoreInfo, centerX, y);
      this.scoreDisplays.push(scoreDisplay);
      this.add(scoreDisplay);
    });
  }

  /**
   * Create individual player score display
   */
  private createPlayerScoreDisplay(
    scene: Phaser.Scene,
    scoreInfo: PlayerScoreInfo,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    // Background panel
    const panelWidth = 700;
    const panelHeight = 100;
    const bgColor = scoreInfo.isWinner ? 0x336633 : 0x333333;
    
    const bg = scene.add.graphics();
    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 10);
    bg.lineStyle(3, scoreInfo.isWinner ? 0xffff00 : 0x666666, 1);
    bg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 10);
    container.add(bg);

    // Rank badge
    const rankBg = scene.add.circle(-panelWidth/2 + 40, 0, 25, 0x666666);
    container.add(rankBg);

    const rankText = scene.add.text(-panelWidth/2 + 40, 0, scoreInfo.rank.toString(), {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    rankText.setOrigin(0.5, 0.5);
    container.add(rankText);

    // Player color indicator
    const colorHex = Phaser.Display.Color.HexStringToColor(scoreInfo.player.color).color;
    const colorBox = scene.add.rectangle(-panelWidth/2 + 100, 0, 40, 40, colorHex);
    container.add(colorBox);

    // Player name
    const nameText = scene.add.text(-panelWidth/2 + 140, -25, scoreInfo.player.name, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    container.add(nameText);

    // Score breakdown
    const vp = scoreInfo.player.victoryPoints;
    const breakdown = `Colonies: ${vp.colonies} | Tech: ${vp.alienTech} | Territory: ${vp.territories} | Bonuses: ${vp.bonuses}`;
    
    const breakdownText = scene.add.text(-panelWidth/2 + 140, 5, breakdown, {
      fontSize: '14px',
      color: '#cccccc'
    });
    container.add(breakdownText);

    // Total score (large, right-aligned)
    const totalText = scene.add.text(panelWidth/2 - 40, 0, scoreInfo.totalScore.toString(), {
      fontSize: '36px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    totalText.setOrigin(1, 0.5);
    container.add(totalText);

    const vpLabel = scene.add.text(panelWidth/2 - 40, 30, 'VP', {
      fontSize: '14px',
      color: '#ffffff'
    });
    vpLabel.setOrigin(1, 0.5);
    container.add(vpLabel);

    // Winner crown
    if (scoreInfo.isWinner) {
      const crown = scene.add.text(-panelWidth/2 + 40, -panelHeight/2 - 20, '👑', {
        fontSize: '32px'
      });
      crown.setOrigin(0.5, 1);
      container.add(crown);

      // Crown bounce animation
      scene.tweens.add({
        targets: crown,
        y: crown.y - 10,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    return container;
  }

  /**
   * Create action buttons
   */
  private createButtons(scene: Phaser.Scene): void {
    const centerX = scene.cameras.main.width / 2;
    const buttonY = scene.cameras.main.height - 100;
    const buttonSpacing = 220;

    // Rematch button
    const rematchButton = this.createButton(
      scene,
      centerX - buttonSpacing/2,
      buttonY,
      'REMATCH',
      0x00aa00,
      () => {
        if (this.onRematch) {
          this.onRematch();
        }
      }
    );
    this.add(rematchButton);

    // Main Menu button
    const menuButton = this.createButton(
      scene,
      centerX + buttonSpacing/2,
      buttonY,
      'MAIN MENU',
      0x0066aa,
      () => {
        if (this.onMainMenu) {
          this.onMainMenu();
        }
      }
    );
    this.add(menuButton);
  }

  /**
   * Create a button
   */
  private createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    const width = 180;
    const height = 50;

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
    bg.lineStyle(3, 0xffffff, 1);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
    container.add(bg);

    // Text
    const buttonText = scene.add.text(0, 0, text, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5, 0.5);
    container.add(buttonText);

    // Make interactive
    container.setSize(width, height);
    container.setInteractive({ cursor: 'pointer' });

    // Hover effects
    container.on('pointerover', () => {
      scene.tweens.add({
        targets: container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        ease: 'Back.easeOut'
      });
    });

    container.on('pointerout', () => {
      scene.tweens.add({
        targets: container,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 200,
        ease: 'Back.easeIn'
      });
    });

    container.on('pointerdown', () => {
      callback();
    });

    return container;
  }

  /**
   * Animate entrance
   */
  private animateEntrance(scene: Phaser.Scene): void {
    // Fade in background
    this.background.setAlpha(0);
    scene.tweens.add({
      targets: this.background,
      alpha: 0.85,
      duration: 500,
      ease: 'Quad.easeOut'
    });

    // Winner text drops in
    if (this.winnerText) {
      this.winnerText.setScale(0);
      scene.tweens.add({
        targets: this.winnerText,
        scaleX: 1,
        scaleY: 1,
        duration: 800,
        delay: 300,
        ease: 'Elastic.easeOut'
      });
    }

    // Score displays slide in sequentially
    this.scoreDisplays.forEach((display, index) => {
      display.setAlpha(0);
      display.x -= 100;

      scene.tweens.add({
        targets: display,
        alpha: 1,
        x: display.x + 100,
        duration: 500,
        delay: 600 + (index * 150),
        ease: 'Back.easeOut'
      });
    });
  }

  /**
   * Show tiebreaker information
   */
  public showTiebreakerInfo(scene: Phaser.Scene, message: string): void {
    const centerX = scene.cameras.main.width / 2;
    const y = 150;

    const tiebreakerText = scene.add.text(centerX, y, message, {
      fontSize: '16px',
      color: '#ffaa00',
      fontStyle: 'italic',
      align: 'center'
    });
    tiebreakerText.setOrigin(0.5, 0.5);
    this.add(tiebreakerText);
  }

  /**
   * Clean up
   */
  public destroy(fromScene?: boolean): void {
    this.scoreDisplays.forEach(display => display.destroy());
    this.scoreDisplays = [];
    super.destroy(fromScene);
  }
}
