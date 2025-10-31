/**
 * DiceSprite - Visual representation of a rolling die
 * 
 * Features:
 * - Rolling animation with tumbling effect
 * - Clear display of final dice value
 * - Multiple dice can roll simultaneously
 * - Visual feedback during rolling
 */

import * as Phaser from 'phaser';

export interface DiceConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    size?: number;
    color?: number;
}

/**
 * DiceSprite displays an animated die with rolling effects
 */
export class DiceSprite extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private valueText: Phaser.GameObjects.Text;
    private currentValue: number = 1;
    private isRolling: boolean = false;
    private rollTween?: Phaser.Tweens.Tween;
    private size: number;
    private diceColor: number;

    constructor(config: DiceConfig) {
        super(config.scene, config.x, config.y);
        
        this.size = config.size || 60;
        this.diceColor = config.color || 0xffffff;

        // Create dice background
        this.background = config.scene.add.graphics();
        this.drawDice();
        this.add(this.background);

        // Create value text
        this.valueText = config.scene.add.text(0, 0, '1', {
            fontSize: `${Math.floor(this.size * 0.6)}px`,
            fontFamily: 'Arial Black',
            color: '#000000',
            align: 'center'
        });
        this.valueText.setOrigin(0.5);
        this.add(this.valueText);

        config.scene.add.existing(this);
    }

    /**
     * Draw the dice background with rounded corners
     */
    private drawDice(): void {
        this.background.clear();
        
        // Draw rounded rectangle for die
        this.background.fillStyle(this.diceColor, 1);
        this.background.fillRoundedRect(
            -this.size / 2,
            -this.size / 2,
            this.size,
            this.size,
            8
        );

        // Draw border
        this.background.lineStyle(3, 0x000000, 1);
        this.background.strokeRoundedRect(
            -this.size / 2,
            -this.size / 2,
            this.size,
            this.size,
            8
        );
    }

    /**
     * Start rolling animation
     * @param finalValue - The value to land on (1-6)
     * @param duration - How long the roll animation lasts in ms
     * @returns Promise that resolves when rolling completes
     */
    public roll(finalValue: number, duration: number = 1000): Promise<void> {
        return new Promise((resolve) => {
            if (this.isRolling) {
                this.stopRoll();
            }

            this.isRolling = true;
            this.currentValue = finalValue;

            // Phase 1: Fast spinning with random values
            const spinDuration = duration * 0.7;
            
            this.rollTween = this.scene.tweens.add({
                targets: this,
                angle: 720, // Spin twice
                duration: spinDuration,
                ease: 'Linear',
                onUpdate: () => {
                    // Show random values while spinning
                    const randomValue = Math.floor(Math.random() * 6) + 1;
                    this.valueText.setText(randomValue.toString());
                },
                onComplete: () => {
                    // Phase 2: Slow down and settle on final value
                    this.scene.tweens.add({
                        targets: this,
                        angle: 900, // Spin a bit more
                        scaleX: 1.2,
                        scaleY: 1.2,
                        duration: duration * 0.2,
                        ease: 'Sine.easeOut',
                        onComplete: () => {
                            // Phase 3: Bounce back to normal and show final value
                            this.valueText.setText(finalValue.toString());
                            this.scene.tweens.add({
                                targets: this,
                                angle: 0,
                                scaleX: 1.0,
                                scaleY: 1.0,
                                duration: duration * 0.1,
                                ease: 'Back.easeOut',
                                onComplete: () => {
                                    this.isRolling = false;
                                    resolve();
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    /**
     * Stop any ongoing roll animation
     */
    public stopRoll(): void {
        if (this.rollTween) {
            this.rollTween.stop();
            this.rollTween = undefined;
        }
        this.isRolling = false;
        this.setRotation(0);
        this.setScale(1);
    }

    /**
     * Set the dice value without animation
     */
    public setValue(value: number): void {
        if (value < 1 || value > 6) {
            console.warn(`Invalid dice value: ${value}. Must be 1-6.`);
            return;
        }
        this.currentValue = value;
        this.valueText.setText(value.toString());
    }

    /**
     * Get the current dice value
     */
    public getValue(): number {
        return this.currentValue;
    }

    /**
     * Check if dice is currently rolling
     */
    public getIsRolling(): boolean {
        return this.isRolling;
    }

    /**
     * Update the dice color
     */
    public setDiceColor(color: number): void {
        this.diceColor = color;
        this.drawDice();
    }

    /**
     * Clean up resources
     */
    public destroy(fromScene?: boolean): void {
        this.stopRoll();
        super.destroy(fromScene);
    }
}

/**
 * DiceRollManager - Coordinates rolling multiple dice simultaneously
 */
export class DiceRollManager {
    private scene: Phaser.Scene;
    private diceSprites: DiceSprite[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Create a set of dice sprites
     * @param count - Number of dice to create
     * @param startX - Starting X position
     * @param startY - Y position for all dice
     * @param spacing - Horizontal spacing between dice
     * @param color - Color of the dice
     */
    public createDice(
        count: number,
        startX: number,
        startY: number,
        spacing: number = 70,
        color: number = 0xffffff
    ): void {
        // Clean up existing dice
        this.clearDice();

        // Create new dice
        for (let i = 0; i < count; i++) {
            const dice = new DiceSprite({
                scene: this.scene,
                x: startX + (i * spacing),
                y: startY,
                color: color
            });
            this.diceSprites.push(dice);
        }
    }

    /**
     * Roll all dice with staggered timing for visual effect
     * @param values - Array of final values (1-6) for each die
     * @param duration - Base duration for each roll
     * @param stagger - Delay between each die starting in ms
     */
    public async rollAll(
        values: number[],
        duration: number = 1000,
        stagger: number = 100
    ): Promise<void> {
        if (values.length !== this.diceSprites.length) {
            console.warn('Values array length must match dice count');
            return;
        }

        // Start all rolls with staggered timing
        const rollPromises = this.diceSprites.map((dice, index) => {
            return new Promise<void>((resolve) => {
                // Add stagger delay
                this.scene.time.delayedCall(stagger * index, () => {
                    dice.roll(values[index], duration).then(resolve);
                });
            });
        });

        // Wait for all rolls to complete
        await Promise.all(rollPromises);
    }

    /**
     * Set dice values without animation
     */
    public setValues(values: number[]): void {
        values.forEach((value, index) => {
            if (index < this.diceSprites.length) {
                this.diceSprites[index].setValue(value);
            }
        });
    }

    /**
     * Get all current dice values
     */
    public getValues(): number[] {
        return this.diceSprites.map(dice => dice.getValue());
    }

    /**
     * Check if any dice are currently rolling
     */
    public isRolling(): boolean {
        return this.diceSprites.some(dice => dice.getIsRolling());
    }

    /**
     * Show/hide all dice
     */
    public setVisible(visible: boolean): void {
        this.diceSprites.forEach(dice => dice.setVisible(visible));
    }

    /**
     * Move all dice to new position
     */
    public moveTo(x: number, y: number, spacing: number = 70): void {
        this.diceSprites.forEach((dice, index) => {
            dice.setPosition(x + (index * spacing), y);
        });
    }

    /**
     * Remove all dice sprites
     */
    public clearDice(): void {
        this.diceSprites.forEach(dice => dice.destroy());
        this.diceSprites = [];
    }

    /**
     * Get reference to dice sprites
     */
    public getDice(): DiceSprite[] {
        return this.diceSprites;
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        this.clearDice();
    }
}
