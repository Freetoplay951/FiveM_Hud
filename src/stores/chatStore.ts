import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { ChatState, ChatMessage, TeamChatState, TeamChatMessage, TeamType } from "@/types/hud";
import { DEMO_CHAT, DEMO_TEAM_CHAT } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/lib/nuiUtils";

export interface ChatCommand {
    command: string;
    description: string;
}

interface ChatStore {
    // Regular chat
    chatMessages: ChatMessage[];
    chatInputActive: boolean;
    chatVisible: boolean;
    chatUnreadCount: number;
    commands: ChatCommand[];

    // Team chat
    teamChatMessages: TeamChatMessage[];
    teamChatInputActive: boolean;
    teamChatVisible: boolean;
    teamChatUnreadCount: number;
    teamChatHasAccess: boolean;
    teamChatIsAdmin: boolean;
    teamType: TeamType;
    teamName: string;
    onlineMembers: number;

    // Actions
    setChatState: (state: Partial<ChatState>) => void;
    setChatInputActive: (active: boolean) => void;
    addChatMessage: (message: ChatMessage) => void;
    clearChatMessages: () => void;
    setCommands: (commands: ChatCommand[]) => void;

    setTeamChatState: (state: Partial<TeamChatState>) => void;
    setTeamChatInputActive: (active: boolean) => void;
    addTeamChatMessage: (message: TeamChatMessage) => void;
    clearTeamChatMessages: () => void;
    setTeamChatAccess: (hasAccess: boolean) => void;
    setTeamChatIsAdmin: (isAdmin: boolean) => void;
}

const isDemoMode = !isNuiEnvironment();

export const useChatStore = create<ChatStore>((set) => ({
    // Regular chat initial state
    chatMessages: isDemoMode ? DEMO_CHAT.messages : [],
    chatInputActive: false,
    chatVisible: isDemoMode ? (DEMO_CHAT.isVisible ?? false) : false,
    chatUnreadCount: 0,
    commands: [],

    // Team chat initial state
    teamChatMessages: isDemoMode ? DEMO_TEAM_CHAT.messages : [],
    teamChatInputActive: false,
    teamChatVisible: isDemoMode ? (DEMO_TEAM_CHAT.isVisible ?? false) : false,
    teamChatUnreadCount: 0,
    teamChatHasAccess: isDemoMode ? DEMO_TEAM_CHAT.hasAccess : false,
    teamChatIsAdmin: isDemoMode ? (DEMO_TEAM_CHAT.isAdmin ?? false) : false,
    teamType: isDemoMode ? DEMO_TEAM_CHAT.teamType : "supporter",
    teamName: isDemoMode ? DEMO_TEAM_CHAT.teamName : "",
    onlineMembers: isDemoMode ? DEMO_TEAM_CHAT.onlineMembers : 0,

    // Chat actions
    setChatState: (state) =>
        set((prev) => ({
            ...prev,
            chatMessages: state.messages ?? prev.chatMessages,
            chatInputActive: state.isInputActive ?? prev.chatInputActive,
            chatVisible: state.isVisible ?? prev.chatVisible,
            chatUnreadCount: state.unreadCount ?? prev.chatUnreadCount,
        })),

    setChatInputActive: (active) =>
        set((prev) => ({
            chatInputActive: active,
            chatUnreadCount: active ? 0 : prev.chatUnreadCount,
        })),

    addChatMessage: (message) =>
        set((prev) => ({
            chatMessages: [...prev.chatMessages, message],
            chatUnreadCount: prev.chatInputActive ? 0 : prev.chatUnreadCount + 1,
            chatVisible: true,
        })),

    clearChatMessages: () => set({ chatMessages: [], chatUnreadCount: 0 }),

    setCommands: (commands) => set({ commands }),

    // Team chat actions
    setTeamChatState: (state) =>
        set((prev) => ({
            ...prev,
            teamChatMessages: state.messages ?? prev.teamChatMessages,
            teamChatInputActive: state.isInputActive ?? prev.teamChatInputActive,
            teamChatVisible: state.isVisible ?? prev.teamChatVisible,
            teamChatUnreadCount: state.unreadCount ?? prev.teamChatUnreadCount,
            teamChatHasAccess: state.hasAccess ?? prev.teamChatHasAccess,
            teamChatIsAdmin: state.isAdmin ?? prev.teamChatIsAdmin,
            teamType: state.teamType ?? prev.teamType,
            teamName: state.teamName ?? prev.teamName,
            onlineMembers: state.onlineMembers ?? prev.onlineMembers,
        })),

    setTeamChatInputActive: (active) =>
        set((prev) => ({
            teamChatInputActive: active,
            teamChatUnreadCount: active ? 0 : prev.teamChatUnreadCount,
        })),

    addTeamChatMessage: (message) =>
        set((prev) => ({
            teamChatMessages: [...prev.teamChatMessages, message],
            teamChatUnreadCount: prev.teamChatInputActive ? 0 : prev.teamChatUnreadCount + 1,
            teamChatVisible: true,
        })),

    clearTeamChatMessages: () => set({ teamChatMessages: [], teamChatUnreadCount: 0 }),

    setTeamChatAccess: (hasAccess) => set({ teamChatHasAccess: hasAccess }),

    setTeamChatIsAdmin: (isAdmin) => set({ teamChatIsAdmin: isAdmin }),
}));

// Chat selectors
export const useChatMessages = () => useChatStore((state) => state.chatMessages);
export const useChatInputActive = () => useChatStore((state) => state.chatInputActive);
export const useChatVisible = () => useChatStore((state) => state.chatVisible);
export const useChatUnreadCount = () => useChatStore((state) => state.chatUnreadCount);
export const useChatCommands = () => useChatStore((state) => state.commands);
export const useChatData = () =>
    useChatStore(
        useShallow((state) => ({
            messages: state.chatMessages,
            isInputActive: state.chatInputActive,
            isVisible: state.chatVisible,
            unreadCount: state.chatUnreadCount,
        })),
    );

// Team chat selectors
export const useTeamChatMessages = () => useChatStore((state) => state.teamChatMessages);
export const useTeamChatInputActive = () => useChatStore((state) => state.teamChatInputActive);
export const useTeamChatVisible = () => useChatStore((state) => state.teamChatVisible);
export const useTeamChatUnreadCount = () => useChatStore((state) => state.teamChatUnreadCount);
export const useTeamChatHasAccess = () => useChatStore((state) => state.teamChatHasAccess);
export const useTeamChatIsAdmin = () => useChatStore((state) => state.teamChatIsAdmin);
export const useTeamType = () => useChatStore((state) => state.teamType);
export const useTeamName = () => useChatStore((state) => state.teamName);
export const useOnlineMembers = () => useChatStore((state) => state.onlineMembers);
export const useTeamChatData = () =>
    useChatStore(
        useShallow((state) => ({
            messages: state.teamChatMessages,
            isInputActive: state.teamChatInputActive,
            isVisible: state.teamChatVisible,
            unreadCount: state.teamChatUnreadCount,
            hasAccess: state.teamChatHasAccess,
            isAdmin: state.teamChatIsAdmin,
            teamType: state.teamType,
            teamName: state.teamName,
            onlineMembers: state.onlineMembers,
        })),
    );
