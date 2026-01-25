import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { ChatState, ChatMessage, TeamChatState, TeamChatMessage, TeamType } from "@/types/hud";
import { DEMO_CHAT, DEMO_TEAM_CHAT } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/lib/nuiUtils";
import { mapPartialState } from "@/lib/utils";

export interface ChatCommand {
    command: string;
    description: string;
}

interface ChatStoreState {
    // Regular chat
    chatMessages: ChatMessage[];
    chatInputActive: boolean;
    chatVisible: boolean;
    chatUnreadCount: number;
    chatCommandOnly: boolean;
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
}

interface ChatStoreActions {
    // Chat actions
    setChatState: (state: Partial<ChatState>) => void;
    setChatInputActive: (active: boolean) => void;
    setChatCommandOnly: (commandOnly: boolean) => void;
    addChatMessage: (message: ChatMessage) => void;
    clearChatMessages: () => void;
    setCommands: (commands: ChatCommand[]) => void;

    // Team chat actions
    setTeamChatState: (state: Partial<TeamChatState>) => void;
    setTeamChatInputActive: (active: boolean) => void;
    addTeamChatMessage: (message: TeamChatMessage) => void;
    clearTeamChatMessages: () => void;
    setTeamChatAccess: (hasAccess: boolean) => void;
    setTeamChatIsAdmin: (isAdmin: boolean) => void;
}

type ChatStore = ChatStoreState & ChatStoreActions;

const isDemoMode = !isNuiEnvironment();

export const useChatStore = create<ChatStore>((set) => ({
    // Regular chat initial state
    chatMessages: isDemoMode ? DEMO_CHAT.messages : [],
    chatInputActive: false,
    chatVisible: isDemoMode ? (DEMO_CHAT.isVisible ?? false) : false,
    chatUnreadCount: 0,
    chatCommandOnly: false,
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
        set((prev) =>
            mapPartialState(prev, {
                chatMessages: state.messages,
                chatInputActive: state.isInputActive,
                chatVisible: state.isVisible,
                chatUnreadCount: state.unreadCount,
                chatCommandOnly: state.commandOnly,
            }),
        ),

    setChatInputActive: (active) =>
        set((prev) => ({
            chatInputActive: active,
            chatUnreadCount: active ? 0 : prev.chatUnreadCount,
        })),

    setChatCommandOnly: (commandOnly) => set({ chatCommandOnly: commandOnly }),

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
        set((prev) =>
            mapPartialState(prev, {
                teamChatMessages: state.messages,
                teamChatInputActive: state.isInputActive,
                teamChatVisible: state.isVisible,
                teamChatUnreadCount: state.unreadCount,
                teamChatHasAccess: state.hasAccess,
                teamChatIsAdmin: state.isAdmin,
                teamType: state.teamType,
                teamName: state.teamName,
                onlineMembers: state.onlineMembers,
            }),
        ),

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
export const useChatCommandOnly = () => useChatStore((state) => state.chatCommandOnly);
export const useChatCommands = () => useChatStore((state) => state.commands);
export const useChatData = () =>
    useChatStore(
        useShallow((state) => ({
            messages: state.chatMessages,
            isInputActive: state.chatInputActive,
            isVisible: state.chatVisible,
            unreadCount: state.chatUnreadCount,
            commandOnly: state.chatCommandOnly,
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
