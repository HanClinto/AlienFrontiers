/**
 * Colonist Hub - Gradual colony construction
 * 4 parallel advancement tracks (7 steps each)
 * Any ship value, advances 1 step per ship
 * At step 7: pay 1 fuel + 1 ore to place colony
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

/**
 * Track state for colonist advancement
 */
export interface ColonistTrack {
  playerId: string;
  progress: number; // 0-7
}

export class ColonistHub extends OrbitalFacility {
  private tracks: ColonistTrack[]; // 4 tracks total

  constructor() {
    super('colonist_hub', 'Colonist Hub', FacilityType.COLONIST_HUB);
    
    // 4 separate docks (one per track)
    this.dockGroups = [
      this.createDockGroup('colonist_hub_track_1', 1, {
        shipCount: 'unlimited',
        valueConstraint: 'any'
      }),
      this.createDockGroup('colonist_hub_track_2', 1, {
        shipCount: 'unlimited',
        valueConstraint: 'any'
      }),
      this.createDockGroup('colonist_hub_track_3', 1, {
        shipCount: 'unlimited',
        valueConstraint: 'any'
      }),
      this.createDockGroup('colonist_hub_track_4', 1, {
        shipCount: 'unlimited',
        valueConstraint: 'any'
      })
    ];

    // Initialize 4 empty tracks
    this.tracks = [
      { playerId: '', progress: 0 },
      { playerId: '', progress: 0 },
      { playerId: '', progress: 0 },
      { playerId: '', progress: 0 }
    ];
  }

  /**
   * Get track state
   */
  getTracks(): ColonistTrack[] {
    return this.tracks;
  }

  /**
   * Get player's track (if any)
   */
  getPlayerTrack(playerId: string): ColonistTrack | undefined {
    return this.tracks.find(t => t.playerId === playerId);
  }

  /**
   * Claim an empty track for a player
   */
  claimTrack(playerId: string): number | null {
    const emptyTrackIndex = this.tracks.findIndex(t => t.playerId === '');
    if (emptyTrackIndex === -1) return null;

    this.tracks[emptyTrackIndex].playerId = playerId;
    this.tracks[emptyTrackIndex].progress = 0;
    return emptyTrackIndex;
  }

  canDock(player: Player, ships: Ship[], dockGroupId?: string): boolean {
    if (ships.length === 0) return false;
    
    // All ships must have dice values
    if (!ships.every(s => s.diceValue !== null)) return false;

    // Player must have a track or be able to claim one
    const playerTrack = this.getPlayerTrack(player.id);
    if (!playerTrack) {
      // Check if empty track available
      const hasEmptyTrack = this.tracks.some(t => t.playerId === '');
      if (!hasEmptyTrack) return false;
    }

    // Player can use any number of ships
    return true;
  }

  getDockRequirements(): DockRequirement[] {
    return [{
      shipCount: 'unlimited',
      valueConstraint: 'any'
    }];
  }

  execute(player: Player, ships: Ship[], options?: any): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Cannot use Colonist Hub - no track available']
      };
    }

    // Get or claim track
    let playerTrack = this.getPlayerTrack(player.id);
    if (!playerTrack) {
      const trackIndex = this.claimTrack(player.id);
      if (trackIndex === null) {
        return {
          success: false,
          errors: ['No empty track available']
        };
      }
      playerTrack = this.tracks[trackIndex];
    }

    // Advance track by number of ships
    const advancement = ships.length;
    playerTrack.progress = Math.min(7, playerTrack.progress + advancement);

    // Check if colony can be placed (at step 7)
    let colonyPlaced = false;
    if (playerTrack.progress === 7) {
      // Check if player has resources to complete colony
      if (player.resources.fuel >= 1 && player.resources.ore >= 1) {
        colonyPlaced = true;
        // Reset track
        playerTrack.playerId = '';
        playerTrack.progress = 0;
      }
    }

    return {
      success: true,
      advancementMade: advancement,
      colonyPlaced: colonyPlaced,
      resourcesSpent: colonyPlaced ? { fuel: 1, ore: 1 } : undefined
    };
  }

  /**
   * Reset a player's track (for testing)
   */
  resetPlayerTrack(playerId: string): void {
    const track = this.getPlayerTrack(playerId);
    if (track) {
      track.playerId = '';
      track.progress = 0;
    }
  }
}

