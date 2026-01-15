import { create } from "zustand";

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
}

interface KeybindsActions {
    setVisible: (visible: boolean) => void;
    toggleVisible: () => void;
    setKeybinds: (keybinds: Keybind[]) => void;
    addKeybind: (keybind: Keybind) => void;
    removeKeybind: (id: string) => void;
    setSearchQuery: (query: string) => void;
    setSelectedKey: (key: string | null) => void;
    setKeyboardExpanded: (expanded: boolean) => void;
    toggleKeyboardExpanded: () => void;
    getKeyBindCount: (key: string) => number;
}

type KeybindsStore = KeybindsState & KeybindsActions;

// Demo keybinds for testing
const demoKeybinds: Keybind[] = [
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

export const useKeybindsStore = create<KeybindsStore>((set, get) => ({
    isVisible: false,
    keybinds: demoKeybinds,
    searchQuery: "",
    selectedKey: null,
    keyboardExpanded: true,

    setVisible: (visible) => set({ isVisible: visible }),
    toggleVisible: () => set((state) => ({ isVisible: !state.isVisible })),

    setKeybinds: (keybinds) => set({ keybinds }),
    addKeybind: (keybind) => set((state) => ({ keybinds: [...state.keybinds, keybind] })),
    removeKeybind: (id) => set((state) => ({ keybinds: state.keybinds.filter((kb) => kb.id !== id) })),

    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedKey: (key) => set({ selectedKey: key }),

    setKeyboardExpanded: (expanded) => set({ keyboardExpanded: expanded }),
    toggleKeyboardExpanded: () => set((state) => ({ keyboardExpanded: !state.keyboardExpanded })),

    getKeyBindCount: (key) => {
        const normalizedKey = key.toUpperCase();
        return get().keybinds.filter((kb) => kb.key.toUpperCase() === normalizedKey).length;
    },
}));

// Selectors for optimized re-renders
export const useKeybindsVisible = () => useKeybindsStore((s) => s.isVisible);
export const useKeybinds = () => useKeybindsStore((s) => s.keybinds);
export const useKeybindsSearch = () => useKeybindsStore((s) => s.searchQuery);
export const useSelectedKey = () => useKeybindsStore((s) => s.selectedKey);
export const useKeyboardExpanded = () => useKeybindsStore((s) => s.keyboardExpanded);
