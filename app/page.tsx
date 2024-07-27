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
    // Add income actions here based on income markers
    // For simplicity, let's assume each player gets 10 coins income
    const incomeActions = players.map(player => ({
      player,
      type: 'income' as ActionType,
      amount: 10
    }));
    setActionLog(prevLog => [...prevLog, ...incomeActions]);

    // Rotate player order based on money spent
    const playersBySpent = [...players].sort((a, b) =>
      getPlayerSpentThisTurn(b) - getPlayerSpentThisTurn(a)
    );
    setCurrentTurn(playersBySpent[0]);
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

    // Move to next player
    const currentIndex = players.indexOf(currentTurn);
    const nextIndex = (currentIndex + 1) % players.length;
    setCurrentTurn(players[nextIndex]);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Brass: Lancashire Money Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Current Turn: {currentTurn}</p>
          <div className="flex items-center mt-2">
            <Input
              type="number"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              placeholder="Enter amount to spend"
              className="mr-2"
            />
            <Button onClick={handleSpend}>Spend</Button>
          </div>
          <Button onClick={endRound} className="mt-2">End Round</Button>
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
