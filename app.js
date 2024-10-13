import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PokerFaces = () => {
  const [gameState, setGameState] = useState('setup');
  const [conversionPercent, setConversionPercent] = useState('');
  const [initialBuyin, setInitialBuyin] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [buyinAmounts, setBuyinAmounts] = useState({});
  const [results, setResults] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [remainingChips, setRemainingChips] = useState({});
  const [error, setError] = useState(null);

  const addPlayer = () => {
    if (currentPlayer && initialBuyin) {
      setPlayers(prev => [...prev, { name: currentPlayer, buyins: parseInt(initialBuyin) || 0 }]);
      setBuyinAmounts(prev => ({ ...prev, [currentPlayer]: '' }));
      setCurrentPlayer('');
    } else {
      setError('Please enter both player name and initial buyin');
    }
  };

  const startGame = () => {
    if (conversionPercent && initialBuyin && players.length > 1) {
      setGameState('playing');
    } else {
      setError('Please fill in all fields and add at least 2 players.');
    }
  };

  const handleBuyinAmountChange = (playerName, amount) => {
    setBuyinAmounts(prev => ({ ...prev, [playerName]: amount }));
  };

  const addBuyin = (playerName) => {
    const amount = parseInt(buyinAmounts[playerName]) || 0;
    setPlayers(prev => prev.map(player => 
      player.name === playerName 
        ? { ...player, buyins: player.buyins + amount } 
        : player
    ));
    setBuyinAmounts(prev => ({ ...prev, [playerName]: '' }));
  };

  const endGame = () => {
    setGameState('entering_chips');
    const initialRemainingChips = players.reduce((acc, player) => {
      acc[player.name] = '';
      return acc;
    }, {});
    setRemainingChips(initialRemainingChips);
  };

  const handleRemainingChipsChange = (playerName, chips) => {
    setRemainingChips(prev => ({
      ...prev,
      [playerName]: chips
    }));
  };

  const finalizeGame = () => {
    const updatedPlayers = players.map(player => ({
      ...player,
      chips: parseInt(remainingChips[player.name]) || 0
    }));

    const totalBuyinChips = players.reduce((sum, player) => sum + player.buyins, 0);
    const totalRemainingChips = updatedPlayers.reduce((sum, player) => sum + player.chips, 0);

    if (totalBuyinChips !== totalRemainingChips) {
      const difference = Math.abs(totalBuyinChips - totalRemainingChips);
      const message = totalBuyinChips > totalRemainingChips
        ? `Error: There are ${difference} chip(s) missing.`
        : `Error: There are ${difference} extra chip(s).`;
      setError(message);
      return;
    }

    setError(null);
    setPlayers(updatedPlayers);
    calculateResults(updatedPlayers);
    setGameState('ended');
  };

  const calculateResults = (finalPlayers) => {
    const totalBuyins = finalPlayers.reduce((sum, player) => sum + player.buyins, 0);
    const totalChips = finalPlayers.reduce((sum, player) => sum + player.chips, 0);
    const chipValue = totalBuyins / totalChips;
    const conversionRate = parseFloat(conversionPercent) / 100;
    
    const results = finalPlayers.map(player => {
      const cashOutChips = player.chips * chipValue;
      const cashOutMoney = cashOutChips * conversionRate;
      return { 
        name: player.name, 
        buyinChips: player.buyins,
        cashOutChips: cashOutChips,
        cashOutMoney: cashOutMoney,
      };
    });

    setResults(results);
    simplifySettlements(results);
  };

  const simplifySettlements = (results) => {
    const playersWithNet = results.map(r => ({
      ...r,
      net: r.cashOutMoney - (r.buyinChips * (parseFloat(conversionPercent) / 100))
    }));
    const payers = playersWithNet.filter(r => r.net < 0).sort((a, b) => a.net - b.net);
    const receivers = playersWithNet.filter(r => r.net > 0).sort((a, b) => b.net - a.net);
    
    const settlements = [];
    let i = 0, j = 0;
    
    while (i < payers.length && j < receivers.length) {
      const amount = Math.min(-payers[i].net, receivers[j].net);
      settlements.push(`${payers[i].name} pays ${receivers[j].name} ${amount.toFixed(2)}`);
      
      payers[i].net += amount;
      receivers[j].net -= amount;
      
      if (Math.abs(payers[i].net) < 0.01) i++;
      if (Math.abs(receivers[j].net) < 0.01) j++;
    }
    
    setSettlements(settlements);
  };

  return (
    <div className="container mx-auto p-2 sm:p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="mb-2 sm:mb-0">PokerFaces</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          
          {gameState === 'setup' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="conversionPercent">Conversion Percent</Label>
                <Input 
                  id="conversionPercent"
                  type="number" 
                  value={conversionPercent} 
                  onChange={(e) => setConversionPercent(e.target.value)} 
                  placeholder="Enter conversion percent"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="initialBuyin">Initial Buyin (chips)</Label>
                <Input 
                  id="initialBuyin"
                  type="number" 
                  value={initialBuyin} 
                  onChange={(e) => setInitialBuyin(e.target.value)} 
                  placeholder="Enter initial buyin"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="playerName">Player Name</Label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Input 
                    id="playerName"
                    value={currentPlayer} 
                    onChange={(e) => setCurrentPlayer(e.target.value)} 
                    placeholder="Enter player name"
                    className="w-full sm:w-2/3"
                  />
                  <Button onClick={addPlayer} className="w-full sm:w-1/3">Add Player</Button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Players:</h3>
                <ul className="list-disc pl-5">
                  {players.map((player, index) => (
                    <li key={index}>{player.name}</li>
                  ))}
                </ul>
              </div>
              <Button onClick={startGame} className="w-full">Start Game</Button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Player</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Total Buyins</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Add Buyin</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {players.map((player, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{player.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{player.buyins}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Input
                            type="number"
                            value={buyinAmounts[player.name]}
                            onChange={(e) => handleBuyinAmountChange(player.name, e.target.value)}
                            placeholder="Amount"
                            className="w-full"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Button onClick={() => addBuyin(player.name)} className="w-full">Add</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={endGame} className="w-full">End Game</Button>
            </div>
          )}

          {gameState === 'entering_chips' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Enter Remaining Chips:</h3>
              {players.map((player, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`chips-${player.name}`}>{player.name}</Label>
                  <Input 
                    id={`chips-${player.name}`}
                    type="number" 
                    value={remainingChips[player.name]} 
                    onChange={(e) => handleRemainingChipsChange(player.name, e.target.value)} 
                    placeholder={`Remaining chips for ${player.name}`}
                    className="w-full"
                  />
                </div>
              ))}
              <Button onClick={finalizeGame} className="w-full">Finalize Game</Button>
            </div>
          )}

          {gameState === 'ended' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Game Results:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Player</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Buy-in (Chips)</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Cash Out (Chips)</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Cash Out (Money)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.map((result, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{result.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{result.buyinChips.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{result.cashOutChips.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{result.cashOutMoney.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="text-lg font-semibold">Simplified Settlements:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {settlements.map((settlement, index) => (
                  <li key={index} className="text-sm">{settlement}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PokerFaces;
