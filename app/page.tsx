'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
    setPlayerIncomes(prev => ({...prev, [player]: income}));
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Brass: Lancashire Money Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Current Round: {currentRound}</p>
          <p>Current Turn: {currentTurn}</p>
          <div className="flex items-center mt-2">
            <Input
              type="number"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              placeholder="Enter amount to spend"
              className="mr-2"
            />
            <Button onClick={handleSpend} className="mr-2">Spend</Button>
            <Button onClick={handleEndTurn}>End Turn</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Player Incomes</CardTitle>
        </CardHeader>
        <CardContent>
          {players.map(player => (
            <div key={player} className="flex items-center justify-between mb-2">
              <span>{player}:</span>
              <Input
                type="number"
                value={playerIncomes[player]}
                onChange={(e) => handleIncomeChange(player, parseInt(e.target.value))}
                className="w-20"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Player Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Current Money</TableHead>
                <TableHead>Spent This Turn</TableHead>
                <TableHead>Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map(player => (
                <TableRow key={player}>
                  <TableCell>{player}</TableCell>
                  <TableCell>{getPlayerMoney(player)}</TableCell>
                  <TableCell>{getPlayerSpentThisTurn(player)}</TableCell>
                  <TableCell>{getTotalPlayerSpent(player)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Action Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            {actionLog.map((action, index) => (
              <li key={index}>
                {action.player} - {action.type}: {action.amount} coins
              </li>
            ))}
          </ul>
          <Button onClick={undoLastAction} className="mt-2">Undo Last Action</Button>
        </CardContent>
      </Card>
    </div>
  );
}
