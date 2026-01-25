import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { MoneyState, PlayerState } from "@/types/hud";
import { DEMO_MONEY, DEMO_PLAYER } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/lib/nuiUtils";
import { mapPartialState } from "@/lib/utils";

interface MoneyStoreState {
    // Money state
    cash: number;
    bank: number;
    blackMoney: number;

    // Player state (related to money display)
    playerId: number;
    job: string;
    rank: string;
}

interface MoneyStoreActions {
    setMoney: (state: Partial<MoneyState>) => void;
    setPlayer: (state: Partial<PlayerState>) => void;
}

type MoneyStore = MoneyStoreState & MoneyStoreActions;

const isDemoMode = !isNuiEnvironment();

export const useMoneyStore = create<MoneyStore>((set) => ({
    cash: isDemoMode ? DEMO_MONEY.cash : 0,
    bank: isDemoMode ? DEMO_MONEY.bank : 0,
    blackMoney: isDemoMode ? (DEMO_MONEY.blackMoney ?? 0) : 0,

    playerId: isDemoMode ? DEMO_PLAYER.id : 0,
    job: isDemoMode ? DEMO_PLAYER.job : "",
    rank: isDemoMode ? DEMO_PLAYER.rank : "",

    setMoney: (state) =>
        set((prev) =>
            mapPartialState(prev, {
                cash: state.cash,
                bank: state.bank,
                blackMoney: state.blackMoney,
            }),
        ),

    setPlayer: (state) =>
        set((prev) =>
            mapPartialState(prev, {
                playerId: state.id,
                job: state.job,
                rank: state.rank,
            }),
        ),
}));

// Selectors
export const useCash = () => useMoneyStore((state) => state.cash);
export const useBank = () => useMoneyStore((state) => state.bank);
export const useBlackMoney = () => useMoneyStore((state) => state.blackMoney);
export const usePlayerJob = () => useMoneyStore((state) => state.job);
export const usePlayerRank = () => useMoneyStore((state) => state.rank);
export const usePlayerId = () => useMoneyStore((state) => state.playerId);
export const useMoneyData = () =>
    useMoneyStore(
        useShallow((state) => ({
            cash: state.cash,
            bank: state.bank,
            blackMoney: state.blackMoney,
        })),
    );
export const usePlayerData = () =>
    useMoneyStore(
        useShallow((state) => ({
            id: state.playerId,
            job: state.job,
            rank: state.rank,
        })),
    );
