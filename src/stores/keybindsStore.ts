import { create } from "zustand";
import { KeyboardLayoutData } from "@/types/translation";

// =============================================================================
// Types
// =============================================================================

export interface Keybind {
    id: string;
    command: string;
    key: string;
    resource: string;
    description?: string;
    isAction?: boolean;
}

interface KeybindsState {
    isVisible: boolean;
    keybinds: Keybind[];
    searchQuery: string;
    selectedKey: string | null;
    keyboardExpanded: boolean;
    layoutOverride: string | null;
    loadedLayouts: Record<string, KeyboardLayoutData>;
}

interface KeybindsActions {
    setVisible: (visible: boolean) => void;
    toggleVisible: () => void;
    setKeybinds: (keybinds: Keybind[]) => void;
    addKeybind: (keybind: Keybind) => void;
    removeKeybind: (id: string) => void;
    setSearchQuery: (query: string) => void;
    setSelectedKey: (key: string | null) => void;
    toggleKeyboardExpanded: () => void;
    setLayoutOverride: (override: string | null) => void;
    loadLayout: (layoutId: string) => Promise<KeyboardLayoutData>;
    getKeyBindCount: (key: string) => number;
}

type KeybindsStore = KeybindsState & KeybindsActions;

// =============================================================================
// Constants
// =============================================================================

const FALLBACK_LAYOUT: KeyboardLayoutData = {
    name: "QWERTY",
    rows: [
        ["ESC", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"],
        ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "BACK"],
        ["TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
        ["CAPS", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "ENTER"],
        ["LSHIFT", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "RSHIFT"],
        ["LCTRL", "WIN", "LALT", "SPACE", "RALT", "FN", "RCTRL"],
    ],
};

const DEMO_KEYBINDS: Keybind[] = [
    { id: "1", command: "/carlock", key: "L", resource: "qb-vehiclekeys", description: "Lock/Unlock vehicle" },
    { id: "2", command: "/engine", key: "Y", resource: "qb-vehiclekeys", description: "Toggle engine" },
    { id: "3", command: "/trunk", key: "G", resource: "qb-vehiclekeys", description: "Open trunk" },
    { id: "4", command: "/hood", key: "G", resource: "qb-vehiclekeys", description: "Open hood" },
    { id: "5", command: "/me", key: "M", resource: "qb-core", description: "RP action", isAction: true },
    { id: "6", command: "/e", key: "E", resource: "dpemotes", description: "Emotes menu" },
    { id: "7", command: "/inventory", key: "TAB", resource: "qb-inventory", description: "Open inventory" },
    { id: "8", command: "/phone", key: "F1", resource: "qb-phone", description: "Open phone" },
    { id: "9", command: "/radio", key: "F2", resource: "pma-voice", description: "Radio menu" },
    { id: "10", command: "/hud", key: "F7", resource: "hud", description: "Toggle HUD" },
    { id: "11", command: "/keybinds", key: "K", resource: "hud", description: "Open keybinds menu" },
    { id: "12", command: "/police", key: "F3", resource: "qb-policejob", description: "Police menu" },
    { id: "13", command: "/ems", key: "F3", resource: "qb-ambulancejob", description: "EMS menu" },
    { id: "14", command: "/mechanic", key: "F3", resource: "qb-mechanicjob", description: "Mechanic menu" },
    { id: "15", command: "/givecash", key: "N", resource: "qb-core", description: "Give cash", isAction: true },
    { id: "16", command: "/headlights", key: "H", resource: "qb-vehiclekeys", description: "Toggle headlights" },
    { id: "17", command: "/cruise", key: "C", resource: "qb-vehiclekeys", description: "Cruise control" },
    { id: "18", command: "/seatbelt", key: "B", resource: "seatbelt", description: "Toggle seatbelt" },
    { id: "19", command: "/ragdoll", key: "X", resource: "dpemotes", description: "Ragdoll" },
    { id: "20", command: "/interact", key: "E", resource: "qb-target", description: "Interact" },
    { id: "21", command: "/crouch", key: "LCTRL", resource: "dpemotes", description: "Crouch" },
    { id: "22", command: "/crawl", key: "X", resource: "dpemotes", description: "Crawl" },
    { id: "23", command: "/carry", key: "G", resource: "qb-policejob", description: "Carry person" },
    { id: "24", command: "/handsup", key: "X", resource: "qb-core", description: "Hands up" },
];

// =============================================================================
// Store
// =============================================================================

export const useKeybindsStore = create<KeybindsStore>((set, get) => ({
    // State
    isVisible: false,
    keybinds: DEMO_KEYBINDS,
    searchQuery: "",
    selectedKey: null,
    keyboardExpanded: true,
    layoutOverride: null,
    loadedLayouts: {},

    // Visibility
    setVisible: (visible) => set({ isVisible: visible }),
    toggleVisible: () => set((s) => ({ isVisible: !s.isVisible })),

    // Keybinds
    setKeybinds: (keybinds) => set({ keybinds }),
    addKeybind: (keybind) => set((s) => ({ keybinds: [...s.keybinds, keybind] })),
    removeKeybind: (id) => set((s) => ({ keybinds: s.keybinds.filter((kb) => kb.id !== id) })),

    // Search & Selection
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedKey: (key) => set({ selectedKey: key }),

    // Keyboard
    toggleKeyboardExpanded: () => set((s) => ({ keyboardExpanded: !s.keyboardExpanded })),
    setLayoutOverride: (override) => set({ layoutOverride: override }),

    loadLayout: async (layoutId) => {
        const cached = get().loadedLayouts[layoutId];
        if (cached) return cached;

        try {
            const res = await fetch(`./langs/keyboards/${layoutId}.json`);
            if (!res.ok) throw new Error(`Layout ${layoutId} not found`);

            const layout: KeyboardLayoutData = await res.json();
            set((s) => ({ loadedLayouts: { ...s.loadedLayouts, [layoutId]: layout } }));
            return layout;
        } catch (error) {
            console.error(`Failed to load layout ${layoutId}:`, error);
            return FALLBACK_LAYOUT;
        }
    },

    getKeyBindCount: (key) => {
        const normalized = key.toUpperCase();
        return get().keybinds.filter((kb) => kb.key.toUpperCase() === normalized).length;
    },
}));

// =============================================================================
// Selectors
// =============================================================================

export const useKeybindsVisible = () => useKeybindsStore((s) => s.isVisible);
export const useKeybinds = () => useKeybindsStore((s) => s.keybinds);
export const useKeybindsSearch = () => useKeybindsStore((s) => s.searchQuery);
export const useSelectedKey = () => useKeybindsStore((s) => s.selectedKey);
export const useKeyboardExpanded = () => useKeybindsStore((s) => s.keyboardExpanded);
export const useLayoutOverride = () => useKeybindsStore((s) => s.layoutOverride);
export const useLoadedLayouts = () => useKeybindsStore((s) => s.loadedLayouts);
