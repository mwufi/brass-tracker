'use client'

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from '@/components/ui/slider'
import cx from 'clsx'

// Critical information for gameplay:
// - Current round
// - Current player's turn
// - Each player's current money
// - Spend action
// - Income action
// - End turn action
//
// Less critical information:
// - Player incomes (only needed at end of round)
// - Detailed action log
// - Undo functionality (useful but not essential)

type Player = 'Player 1' | 'Player 2' | 'Player 3';
type ActionType = 'spend' | 'income';

interface Action {
  player: Player;
  type: ActionType;
  amount: number;
  round: number;
}

export default function Home() {
  const [players] = useState<Player[]>(['Player 1', 'Player 2', 'Player 3']);
  const [actionLog, setActionLog] = useState<Action[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Player>('Player 1');
  const [spendAmount, setSpendAmount] = useState<string>('');
  const [incomeAmount, setIncomeAmount] = useState<string>('');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [turnOrder, setTurnOrder] = useState<Player[]>(players);
  const [playerIncomes, setPlayerIncomes] = useState<Record<Player, number>>({
    'Player 1': 0,
    'Player 2': 0,
    'Player 3': 0
  });
  const [expandedPlayer, setExpandedPlayer] = useState<Player | null>(null);
  const [showRoundInfo, setShowRoundInfo] = useState<boolean>(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const [showNamePopup, setShowNamePopup] = useState<boolean>(true);
  const [playerNames, setPlayerNames] = useState<Record<Player, string>>({
    'Player 1': 'Player 1',
    'Player 2': 'Player 2',
    'Player 3': 'Player 3'
  });

  if (showNamePopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Set Player Names</h2>
          {players.map((player) => (
            <div key={player} className="mb-4">
              <label htmlFor={`name-${player}`} className="block mb-2">{player}</label>
              <input
                id={`name-${player}`}
                type="text"
                value={playerNames[player]}
                onChange={(e) => setPlayerNames(prev => ({ ...prev, [player]: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
          <button
            onClick={() => setShowNamePopup(false)}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  const togglePlayerInfo = (player: Player) => {
    setExpandedPlayer(expandedPlayer === player ? null : player);
  };

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

  // const getTotalPlayerSpent = (player: Player) => {
  //   return actionLog.reduce((total, action) => {
  //     if (action.player === player && action.type === 'spend') {
  //       return total + action.amount;
  //     }
  //     return total;
  //   }, 0);
  // };

  const getTotalPlayerSpentInRound = (player: Player, round: number) => {
    return actionLog.reduce((total, action) => {
      if (action.player === player && action.type === 'spend' && action.round === round) {
        return total + action.amount;
      }
      return total;
    }, 0);
  };

  const undoLastAction = () => {
    setActionLog(prevLog => prevLog.slice(0, -1));
  };

  const onRoundEnd = () => {
    const incomeActions = players.map(player => ({
      player,
      type: 'income' as ActionType,
      amount: playerIncomes[player],
      round: currentRound
    }));
    setActionLog(prevLog => [...prevLog, ...incomeActions]);

    const playersBySpent = [...players].sort((a, b) => {
      const spentA = getTotalPlayerSpentInRound(a, currentRound);
      const spentB = getTotalPlayerSpentInRound(b, currentRound);
      if (spentA === spentB) {
        // If tie, preserve existing order in turnOrder
        return turnOrder.indexOf(a) - turnOrder.indexOf(b);
      }
      return spentA - spentB; // Sort in descending order of spent amount
    });
    setTurnOrder(playersBySpent);
    setCurrentTurn(playersBySpent[0]);
    setCurrentRound(prevRound => prevRound + 1);
  };

  const handleSpend = () => {
    const amount = parseInt(spendAmount);
    if (isNaN(amount) || amount <= 0) return;

    const currentPlayerMoney = getPlayerMoney(currentTurn);
    if (amount > currentPlayerMoney) {
      alert(`You can't spend more than £${currentPlayerMoney}!`);
      return;
    }

    const newAction: Action = {
      player: currentTurn,
      type: 'spend',
      amount: amount,
      round: currentRound
    };

    setActionLog(prevLog => [...prevLog, newAction]);
    setSpendAmount('');
  };

  const handleIncome = () => {
    const amount = parseInt(incomeAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newAction: Action = {
      player: currentTurn,
      type: 'income',
      amount: amount,
      round: currentRound
    };

    setActionLog(prevLog => [...prevLog, newAction]);
    setIncomeAmount('');
  };

  const handleEndTurn = () => {
    const currentIndex = turnOrder.indexOf(currentTurn);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    setCurrentTurn(turnOrder[nextIndex]);

    if (nextIndex === 0) {
      onRoundEnd();
    }
  };

  const handleIncomeChange = (player: Player, income: number) => {
    if (income < -10) {
      alert("Income can't be less than -10!");
      return;
    }
    setPlayerIncomes(prev => ({ ...prev, [player]: income }));
  };

  const getTotalSpentThisRound = () => {
    return turnOrder.reduce((total, player) => total + getPlayerSpentThisTurn(player), 0);
  };

  const getPlayerWhoSpentMost = () => {
    return turnOrder.reduce((maxPlayer, player) =>
      getPlayerSpentThisTurn(player) > getPlayerSpentThisTurn(maxPlayer) ? player : maxPlayer
    );
  };

  return (
    <div className="bg-[#8B4513] min-h-screen p-4 bg-opacity-80 bg-blend-overlay overflow-hidden" style={{ backgroundImage: "url('https://t4.ftcdn.net/jpg/00/77/67/75/360_F_77677518_JmjvLKvu9yQN8Sr8uKjkQEYMakzXgV3p.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="max-w-8xl mx-auto bg-[#F5DEB3] rounded-lg shadow-2xl overflow-hidden relative">
        <Button
          onClick={handleEndTurn}
          className="absolute top-8 right-8 z-10 bg-[#F5DEB3] text-[#8B4513] hover:bg-[#F0E0C0] border-4 border-[#8B4513] text-xl px-4 py-6 rounded-full shadow-xl"
        >
          End Turn
        </Button>
        <header className="bg-[#8B4513] text-[#F5DEB3] p-6 relative cursor-pointer" onClick={() => setShowRoundInfo(!showRoundInfo)}>
          {showRoundInfo && (
            <div className="absolute top-full left-0 right-0 bg-[#A0522D] p-4 rounded-b-lg shadow-md z-10">
              <p>Total spent this round: £{getTotalSpentThisRound()}</p>
              {turnOrder.map(player => (
                <p key={player}>{player} spent: £{getPlayerSpentThisTurn(player)}</p>
              ))}
              <p>Current turn order: {turnOrder.join(', ')}</p>
            </div>
          )}
        </header>

        <main className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {turnOrder.map(player => (
              <div key={player} className={cx(
                "p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl cursor-pointer",
                {
                  "bg-[#D2B48C]": player !== currentTurn,
                  "bg-[#90EE90]": player === currentTurn
                }
              )} onClick={() => togglePlayerInfo(player)}>
                <h3 className="text-lg font-semibold">{playerNames[player]}</h3>
                <p className="text-2xl font-bold">£{getPlayerMoney(player)}</p>
                <p className="text-md text-gray-600">Spent: £{getTotalPlayerSpentInRound(player, currentRound)}</p>
                <p className="text-md text-gray-600">Income: £{playerIncomes[player]}</p>
                {expandedPlayer === player && (
                  <div className="mt-4 bg-[#F5DEB3] p-2 rounded animate-expand">
                    <h4 className="font-semibold mb-2">Actions:</h4>
                    <ul className="text-sm">
                      {actionLog.filter(action => action.player === player).map((action, index) => (
                        <li key={index} className="mb-1">
                          Round {action.round}: {action.type} £{action.amount}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-[#D2B48C] p-4 rounded-lg shadow-md mb-6">
            <div className="flex flex-col mb-4">
              <div className="flex items-center w-full mb-2">
                <div className="w-full mr-2 relative">
                  <Slider
                    min={0}
                    max={15}
                    step={1}
                    value={[parseInt(spendAmount)]}
                    onValueChange={(value) => setSpendAmount(value[0].toString())}
                    className="w-full h-12"
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="absolute h-full w-1 bg-[#8B4513] opacity-20" style={{ left: `${i * (100 / 15)}%` }}></div>
                    ))}
                  </div>
                </div>
                <span className="ml-2 min-w-[60px] text-center text-3xl font-bold">{spendAmount}</span>
              </div>
              <Button onClick={handleSpend} className="bg-[#8B4513] text-[#F5DEB3] hover:bg-[#A0522D] py-6 text-lg">Spend</Button>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center w-full mb-2">
                <div className="w-full mr-2 relative">
                  <Slider
                    min={0}
                    max={15}
                    step={1}
                    value={[parseInt(incomeAmount)]}
                    onValueChange={(value) => setIncomeAmount(value[0].toString())}
                    className="w-full h-12"
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="absolute h-full w-1 bg-[#8B4513] opacity-20" style={{ left: `${i * (100 / 15)}%` }}></div>
                    ))}
                  </div>
                </div>
                <span className="ml-2 min-w-[60px] text-center text-3xl font-bold">{incomeAmount}</span>
              </div>
              <Button onClick={handleIncome} className="bg-[#8B4513] text-[#F5DEB3] hover:bg-[#A0522D] py-6 text-lg">Add Money</Button>
            </div>
          </div>

          <div className="bg-[#D2B48C] p-4 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-4">Player Incomes</h2>
            <div>
              {players.map(player => (
                <div key={player} className="flex flex-row items-center justify-between w-full mb-2">
                  <span className="mb-2 text-xl">{playerNames[player]}</span>
                  <div className="flex items-center text-2xl">
                    <Button
                      onClick={() => handleIncomeChange(player, playerIncomes[player] - 1)}
                      className="w-12 h-12 bg-[#8B4513] text-[#F5DEB3] hover:bg-[#A0522D] text-6xl"
                    >
                      -
                    </Button>
                    <span className="mx-2 w-10 text-center text-right">£{playerIncomes[player]}</span>
                    <Button
                      onClick={() => handleIncomeChange(player, playerIncomes[player] + 1)}
                      className="w-12 h-12 bg-[#8B4513] text-[#F5DEB3] hover:bg-[#A0522D] text-4xl"
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#D2B48C] p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Action Log</h2>
            <ul className="bg-[#F5DEB3] p-4 rounded max-h-60 overflow-y-auto">
              {actionLog.slice().reverse().map((action, index) => (
                <li key={index} className="mb-2 p-2 bg-[#D2B48C] rounded">
                  <span className="font-semibold">{action.player}</span> - {action.type}: £{action.amount}
                </li>
              ))}
            </ul>
            <Button onClick={undoLastAction} className="mt-4 bg-[#8B4513] text-[#F5DEB3] hover:bg-[#A0522D]">Undo Last Action</Button>
          </div>
        </main>
      </div >
    </div >
  );
}