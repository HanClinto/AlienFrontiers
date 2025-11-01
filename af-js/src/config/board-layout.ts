/**
 * Board Layout Configuration
 * 
 * Defines the pixel coordinates for all UI elements on the game board.
 * Board dimensions: 1536×2048 (portrait orientation)
 * 
 * Coordinate system:
 * - Origin (0,0) is top-left corner
 * - X increases rightward
 * - Y increases downward
 */

export interface Position {
    x: number;
    y: number;
}

export interface DockPosition extends Position {
    /** Number of ship slots available at this dock */
    slots: number;
    /** Spacing between ships in pixels */
    spacing?: number;
}

export interface TerritoryPosition extends Position {
    /** Territory name */
    name: string;
    /** Maximum colonies allowed */
    maxColonies: number;
    /** Layout for colony markers */
    colonyLayout: 'horizontal' | 'vertical' | 'grid';
}

/**
 * Facility dock locations on the board
 * These are the CONTAINER ORIGINS where facility layers are positioned
 * 
 * In iOS, each facility is a container (LayerOrbital) positioned on the board.
 * Child elements (docks, labels, icons) are positioned relative to the container origin.
 * 
 * Docks within container: ccp(12 + cnt * 26, 8 - 162) @1x = (24 + cnt * 52, -308) @2x
 * Use getDockSlotPosition() to get absolute dock positions for ship placement.
 */
export const FACILITY_DOCKS: Record<string, DockPosition> = {
    // Coordinates from iOS LayerOrbitals.m (768×1024 @1x) -> Phaser portrait (1536×2048 @2x)
    // iOS uses bottom-left origin, Phaser uses top-left origin
    // Transform: Phaser_x = iOS_x * 2, Phaser_y = (1024 - iOS_y) * 2
    // These are CONTAINER ORIGINS where facility layers are positioned in scene space
    
    SOLAR_CONVERTER: {
        x: 360,    // iOS: ccp(180, 800) -> (180*2, (1024-800)*2) = (360, 448)
        y: 448,
        slots: 1,
    },
    ORBITAL_MARKET: {
        x: 898,    // iOS: ccp(180 + 269, 800 + 25) = ccp(449, 825) -> (898, 398)
        y: 398,
        slots: 2,
    },
    ALIEN_ARTIFACT: {
        x: 1202,   // iOS: ccp(180 + 269 + 152, 800 + 10 - 16) = ccp(601, 794) -> (1202, 460)
        y: 460,
        slots: 1,
    },
    TERRAFORMING_STATION: {
        x: 56,     // iOS: ccp(180 - 156 + 4, 800 - 365 + 268) = ccp(28, 703) -> (56, 642)
        y: 642,
        slots: 2,
    },
    SHIPYARD: {
        x: 48,     // iOS: ccp(180 - 156, 800 - 365) = ccp(24, 435) -> (48, 1178)
        y: 1178,
        slots: 3,
    },
    MAINTENANCE_BAY: {
        x: 48,     // iOS: ccp(180 - 156, 800 - 365 + 268 - 116) = ccp(24, 587) -> (48, 874)
        y: 874,
        slots: 2,
    },
    COLONIST_HUB: {
        x: 48,     // iOS: ccp(180 - 156, 800 - 365 - 131 + 10) = ccp(24, 314) -> (48, 1420)
        y: 1420,
        slots: 4,
    },
    LUNAR_MINE: {
        x: 1100,   // iOS: ccp(550, 325) -> (550*2, (1024-325)*2) = (1100, 1398)
        y: 1398,
        slots: 3,
    },
    RAIDER_OUTPOST: {
        x: 1226,   // iOS: ccp(613, 425) -> (613*2, (1024-425)*2) = (1226, 1198)
        y: 1198,
        slots: 3,
    },
    COLONY_CONSTRUCTOR: {
        x: 692,    // iOS: ccp(180 - 156 + 322, 800 - 365 - 144) = ccp(346, 291) -> (692, 1466)
        y: 1466,
        slots: 3,
    },
};

/**
 * Territory locations on the board
 * These are the six areas where colonies can be built
 * Coordinates from iOS portrait mode (768×1024) -> Phaser portrait (1536×2048)
 * Transform: Phaser_x = iOS_x * 2, Phaser_y = (1024 - iOS_y) * 2
 */
export const TERRITORIES: Record<string, TerritoryPosition> = {
    HEINLEIN_PLAINS: {
        x: 872,    // iOS: (436, 738) -> (436*2, (1024-738)*2) = (872, 572)
        y: 572,
        name: "Heinlein Plains",
        maxColonies: 3,
        colonyLayout: 'horizontal',
    },
    ASIMOV_CRATER: {
        x: 522,    // iOS: (261, 520) -> (261*2, (1024-520)*2) = (522, 1008)
        y: 1008,
        name: "Asimov Crater",
        maxColonies: 3,
        colonyLayout: 'horizontal',
    },
    BRADBURY_PLATEAU: {
        x: 748,    // iOS: (374, 469) -> (374*2, (1024-469)*2) = (748, 1110)
        y: 1110,
        name: "Bradbury Plateau",
        maxColonies: 3,
        colonyLayout: 'vertical',
    },
    BURROUGHS_DESERT: {
        x: 748,    // iOS: (374, 604) -> (374*2, (1024-604)*2) = (748, 840)
        y: 840,
        name: "Burroughs Desert",
        maxColonies: 3,
        colonyLayout: 'vertical',
    },
    HERBERT_VALLEY: {
        x: 464,    // iOS: (232, 635) -> (232*2, (1024-635)*2) = (464, 778)
        y: 778,
        name: "Herbert Valley",
        maxColonies: 3,
        colonyLayout: 'horizontal',
    },
    VAN_VOGT_MOUNTAINS: {
        x: 978,    // iOS: (489, 520) -> (489*2, (1024-520)*2) = (978, 1008)
        y: 1008,
        name: "Van Vogt Mountains",
        maxColonies: 3,
        colonyLayout: 'horizontal',
    },
};

/**
 * Player tray positions
 * Each player has an area for their ships, resources, and info
 */
export const PLAYER_TRAYS: Record<number, Position> = {
    0: { x: 150, y: 1600 },  // Player 1 - bottom left
    1: { x: 1386, y: 1600 }, // Player 2 - bottom right
    2: { x: 150, y: 1800 },  // Player 3 - bottom left (if 3-4 players)
    3: { x: 1386, y: 1800 }, // Player 4 - bottom right (if 3-4 players)
};

/**
 * Player HUD positions (resource display, VP, etc.)
 */
export const PLAYER_HUD_POSITIONS: Record<number, Position> = {
    0: { x: 100, y: 100 },   // Player 1 - top left
    1: { x: 1436, y: 100 },  // Player 2 - top right
    2: { x: 100, y: 250 },   // Player 3 - below player 1
    3: { x: 1436, y: 250 },  // Player 4 - below player 2
};

/**
 * Turn control button positions
 * iOS: uiFrame at (384, -117), buttons relative to frame
 * Phaser: Frame at bottom, Y=2048-117*2 = 1814
 */
export const TURN_CONTROLS = {
    ROLL_DICE: {
        x: (635 - 375) * 2,  // iOS: 635-375 = 260 → Phaser: 520
        y: 2048 - (117 + 92) * 2,  // iOS: 92-117 → Phaser: bottom - offset = 1630
    },
    END_TURN: {
        x: (693 - 375 - 16 + 3) * 2,  // iOS: done button position = 305 → Phaser: 610
        y: 2048 - (117 + 128 - 80 - 4) * 2,  // iOS: doneButton Y → Phaser: 1956
    },
    UNDO: {
        x: (693 - 375 - 122 + 3) * 2,  // iOS: 199 → Phaser: 398
        y: 2048 - (117 + 126 - 82) * 2,  // iOS: undoButton Y → Phaser: 1926
    },
    REDO: {
        x: (577 - 375 + 37 + 3) * 2,  // iOS: 242 → Phaser: 484
        y: 2048 - (117 + 126 - 82) * 2,  // iOS: redoButton Y → Phaser: 1926
    },
};

/**
 * Dice display area - Rolling Tray Position
 * iOS: LayerHUDPort.m line 710 - rollingTrayPosition returns ccp(635, 92)
 * Transform: x = 635 * 2 = 1270, y = (1024 - 92) * 2 = 1864
 * This is in the bottom-right area where dice appear after rolling
 */
export const DICE_AREA = {
    x: 1270,  // iOS: 635 * 2
    y: 1864,  // iOS: (1024 - 92) * 2 - bottom-right rolling tray position
    spacing: 80,
    maxDice: 8, // Maximum 8 dice for a player
};

/**
 * Tech card hand position
 * iOS: LayerHUDPort.m line 205-208
 *   cardTray at iOS child coords (-166, 47) relative to uiFrame
 *   Converted via convertIOSChildCoordinates(-166, 47):
 *     phaserX = -166 * 2 = -332
 *     phaserY = -(47 + 234/2) * 2 = -328
 * 
 * PlayerHUDLayer container at (768, 2010) with bottom-center anchor
 * Card tray image absolute position (left-center):
 *   x = 768 + (-332) = 436
 *   y = 2010 + (-328) = 1682
 * 
 * TechCardHand has origin (0,0) = top-left
 * Card tray has origin (0,0.5) = left-center
 * Card tray image is ~72px tall, so adjust up by half: 1682 - 36 = 1646
 */
export const TECH_CARD_HAND = {
    x: 436,   // Matches cardTray left edge
    y: 1646,  // Top edge of card tray (adjusted from center)
    cardSpacing: 120,
    maxCards: 6,
};

/**
 * Notification area (for AI actions and game events)
 */
export const NOTIFICATION_AREA = {
    x: 1350,
    y: 400,
    maxNotifications: 5,
    notificationSpacing: 80,
};

/**
 * Central play area (for animations, temporary displays)
 */
export const CENTRAL_AREA = {
    x: 768,
    y: 1024,
};

/**
 * Resource icon positions in HUD
 */
export const RESOURCE_ICONS = {
    ORE: {
        offsetX: 0,
        offsetY: 40,
    },
    FUEL: {
        offsetX: 80,
        offsetY: 40,
    },
    COLONY: {
        offsetX: 160,
        offsetY: 40,
    },
    TECH_CARD: {
        offsetX: 240,
        offsetY: 40,
    },
};

/**
 * Sizing constants
 */
export const SIZES = {
    SHIP: 50,              // Ship dice sprite size
    COLONY_MARKER: 40,     // Colony marker size
    TECH_CARD_WIDTH: 100,  // Tech card width
    TECH_CARD_HEIGHT: 140, // Tech card height
    BUTTON_WIDTH: 120,     // Standard button width
    BUTTON_HEIGHT: 50,     // Standard button height
    FACILITY_HITBOX: 80,   // Facility interaction area
};

/**
 * Animation offsets
 */
export const ANIMATION_OFFSETS = {
    HOVER_Y: -10,          // Vertical offset for hover effect
    SELECTED_SCALE: 1.1,   // Scale multiplier for selected items
    PLACEMENT_PREVIEW_ALPHA: 0.6, // Alpha for placement preview
};

/**
 * Get dock position for a specific slot
 * 
 * iOS dock layout: ccp(12 + cnt * (width + 2), 8 - 162) @1x
 * - Base X: 12px @1x = 24px @2x
 * - Spacing: 26px @1x (24px width + 2px gap) = 52px @2x
 * - Base Y: (8 - 162) @1x = -308px @2x (relative to container origin)
 * 
 * FACILITY_DOCKS.x and .y represent the facility CONTAINER origin
 * Docks are positioned relative to that origin
 */
export function getDockSlotPosition(facilityName: string, slotIndex: number): Position {
    const dock = FACILITY_DOCKS[facilityName];
    if (!dock) {
        throw new Error(`Unknown facility: ${facilityName}`);
    }
    
    // iOS dock positioning (converted to Phaser @2x):
    // x = 12 + slotIndex * (24 + 2) = 12 + slotIndex * 26 @1x
    // x = 24 + slotIndex * 52 @2x
    // y = (8 - 162) = -154 @1x = -308 @2x
    const dockBaseX = 24;      // 12px @1x * 2
    const dockSpacing = 52;    // 26px @1x * 2 (24px width + 2px gap)
    const dockY = -308;        // (8 - 162) @1x * 2
    
    // For centered arrangement, calculate offset from leftmost dock
    // With N docks, center is at index (N-1)/2
    // Offset for centering: move left by half the total width
    const totalWidth = (dock.slots - 1) * dockSpacing;
    const centerOffset = -totalWidth / 2;
    
    return {
        x: dock.x + dockBaseX + (slotIndex * dockSpacing) + centerOffset,
        y: dock.y + dockY,
    };
}

/**
 * Get colony position for a territory
 */
export function getColonyPosition(territoryName: string, colonyIndex: number): Position {
    const territory = TERRITORIES[territoryName];
    if (!territory) {
        throw new Error(`Unknown territory: ${territoryName}`);
    }
    
    const spacing = 50;
    
    if (territory.colonyLayout === 'horizontal') {
        const offsetX = (colonyIndex - (territory.maxColonies - 1) / 2) * spacing;
        return {
            x: territory.x + offsetX,
            y: territory.y,
        };
    } else if (territory.colonyLayout === 'vertical') {
        const offsetY = (colonyIndex - (territory.maxColonies - 1) / 2) * spacing;
        return {
            x: territory.x,
            y: territory.y + offsetY,
        };
    } else {
        // Grid layout
        const cols = 2;
        const row = Math.floor(colonyIndex / cols);
        const col = colonyIndex % cols;
        return {
            x: territory.x + (col - 0.5) * spacing,
            y: territory.y + (row - 0.5) * spacing,
        };
    }
}

/**
 * Get dice position in the dice area
 */
export function getDicePosition(diceIndex: number, totalDice: number): Position {
    const totalWidth = (totalDice - 1) * DICE_AREA.spacing;
    const startX = DICE_AREA.x - totalWidth / 2;
    
    return {
        x: startX + diceIndex * DICE_AREA.spacing,
        y: DICE_AREA.y,
    };
}

/**
 * Check if a position is within a facility's interaction area
 */
export function isPositionInFacility(x: number, y: number, facilityName: string): boolean {
    const dock = FACILITY_DOCKS[facilityName];
    if (!dock) return false;
    
    const halfSize = SIZES.FACILITY_HITBOX / 2;
    return (
        x >= dock.x - halfSize &&
        x <= dock.x + halfSize &&
        y >= dock.y - halfSize &&
        y <= dock.y + halfSize
    );
}
