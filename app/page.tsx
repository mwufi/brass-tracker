'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Critical information for gameplay:
// - Current round
// - Current player's turn
// - Each player's current money
// - Spend action
// - End turn action
//
// Less critical information:
// - Player incomes (only needed at end of round)
// - Detailed action log
// - Undo functionality (useful but not essential)

type Player = 'Player 1' | 'Player 2' | 'Player 3' | 'Player 4';
type ActionType = 'spend' | 'income';

interface Action {
  player: Player;
  type: ActionType;
  amount: number;
}

export default function Home() {
  const [players] = useState<Player[]>(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [actionLog, setActionLog] = useState<Action[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Player>('Player 1');
  const [spendAmount, setSpendAmount] = useState<string>('');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [turnOrder, setTurnOrder] = useState<Player[]>(players);
  const [playerIncomes, setPlayerIncomes] = useState<Record<Player, number>>({
    'Player 1': 0,
    'Player 2': 0,
    'Player 3': 0,
    'Player 4': 0
  });

  const getPlayerMoney = (player: Player) => {
    return actionLog.reduce((total, action) => {
      if (action.player === player) {
        return action.type === 'spend' ? total - action.amount : total + action.amount;
      }
      return total;
    }, 30);
  };

  const getPlayerSpentThisTurn = (player: Player) => {
    const lastIncomeIndex = actionLog.findLastIndex(action => action.type === 'income');
    return actionLog.slice(lastIncomeIndex + 1).reduce((total, action) => {
      if (action.player === player && action.type === 'spend') {
        return total + action.amount;
      }
      return total;
    }, 0);
  };

  const getTotalPlayerSpent = (player: Player) => {
    return actionLog.reduce((total, action) => {
      if (action.player === player && action.type === 'spend') {
        return total + action.amount;
      }
      return total;
    }, 0);
  };

  const undoLastAction = () => {
    setActionLog(prevLog => prevLog.slice(0, -1));
  };

  const endRound = () => {
    const incomeActions = players.map(player => ({
      player,
      type: 'income' as ActionType,
      amount: playerIncomes[player]
    }));
    setActionLog(prevLog => [...prevLog, ...incomeActions]);

    const playersBySpent = [...players].sort((a, b) =>
      getPlayerSpentThisTurn(b) - getPlayerSpentThisTurn(a)
    );
    setTurnOrder(playersBySpent);
    setCurrentTurn(playersBySpent[0]);
    setCurrentRound(prevRound => prevRound + 1);
  };

  const handleSpend = () => {
    const amount = parseInt(spendAmount);
    if (isNaN(amount) || amount <= 0) return;

    const currentPlayerMoney = getPlayerMoney(currentTurn);
    if (amount > currentPlayerMoney + 10) {
      alert(`You can't spend more than £${currentPlayerMoney + 10}!`);
      return;
    }

    const newAction: Action = {
      player: currentTurn,
      type: 'spend',
      amount: amount
    };

    setActionLog(prevLog => [...prevLog, newAction]);
    setSpendAmount('');
  };

  const handleEndTurn = () => {
    const currentIndex = turnOrder.indexOf(currentTurn);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    setCurrentTurn(turnOrder[nextIndex]);

    if (nextIndex === 0) {
      endRound();
    }
  };

  const handleIncomeChange = (player: Player, income: number) => {
    if (income < -10) {
      alert("Income can't be less than -10!");
      return;
    }
    setPlayerIncomes(prev => ({...prev, [player]: income}));
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">Brass: Lancashire Money Tracker</h1>
          <p className="text-lg">Round {currentRound} - {currentTurn}'s Turn</p>
        </header>

        <main className="p-4">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Player Money</h2>
            <div className="grid grid-cols-2 gap-2">
              {players.map(player => (
                <div key={player} className="bg-gray-200 p-2 rounded">
                  <span className="font-medium">{player}:</span> £{getPlayerMoney(player)}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Spend Money</h2>
            <div className="flex">
              <Input
                type="number"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                placeholder="Amount"
                className="mr-2 flex-grow"
              />
              <Button onClick={handleSpend} className="bg-green-500 text-white">Spend</Button>
            </div>
          </div>

          <Button onClick={handleEndTurn} className="w-full bg-blue-500 text-white mb-6">End Turn</Button>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Player Incomes</h2>
            {players.map(player => (
              <div key={player} className="flex items-center mb-2">
                <span className="mr-2">{player}:</span>
                <Input
                  type="number"
                  value={playerIncomes[player]}
                  onChange={(e) => handleIncomeChange(player, parseInt(e.target.value))}
                  className="w-20"
                />
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Action Log</h2>
            <ul className="bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
              {actionLog.slice().reverse().map((action, index) => (
                <li key={index} className="mb-1">
                  {action.player} - {action.type}: £{action.amount}
                </li>
              ))}
            </ul>
            <Button onClick={undoLastAction} className="mt-2 bg-red-500 text-white">Undo Last Action</Button>
          </div>
        </main>
      </div>
    </div>
  );
}
