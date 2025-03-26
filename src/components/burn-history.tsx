import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trash2, ExternalLink, Trophy, Award, Star, Share2, Twitter, Skull, AlertTriangle, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';

export function BurnHistory() {
  const { burnHistory, totalBurned, comboMultiplier, resetStore } = useStore();
  const [hasDuplicates, setHasDuplicates] = useState(false);
  
  // Filter out duplicates by txId for display
  const uniqueHistory = burnHistory.reduce((acc, current) => {
    const existingIndex = acc.findIndex(item => item.txId === current.txId);
    if (existingIndex === -1) {
      // Item doesn't exist yet, add it
      acc.push(current);
    }
    return acc;
  }, [] as typeof burnHistory);
  
  // Check if there are duplicates in the history
  useEffect(() => {
    const txIds = burnHistory.map(item => item.txId);
    const uniqueTxIds = new Set(txIds);
    setHasDuplicates(txIds.length !== uniqueTxIds.size);
  }, [burnHistory]);

  // Clean duplicates from the store
  const cleanupDuplicates = () => {
    if (!hasDuplicates) return;
    
    // Create a map to track seen txIds while preserving original order
    const seen = new Map();
    const cleaned = [];
    
    // Process items in reverse order to keep original timestamps
    // This ensures we keep the first occurrence of each txId
    for (let i = burnHistory.length - 1; i >= 0; i--) {
      const item = burnHistory[i];
      if (!seen.has(item.txId)) {
        seen.set(item.txId, true);
        cleaned.unshift(item); // Add to front to maintain original order
      }
    }
    
    // Clear the store
    resetStore();
    
    // Get store state for adding burns back
    const storeState = useStore.getState();
    
    // Add items back in original order with original timestamps
    cleaned.forEach(item => {
      storeState.addBurn(
        item.name,
        item.symbol,
        item.value,
        item.txId,
        item.timestamp
      );
    });
  };

  // Use Blockscan.com which works across all chains
  const getTransactionUrl = (txHash: string) => {
    return `https://blockscan.com/tx/${txHash}`;
  };

  // Determine user rank based on number of burns
  const getRank = (burnCount: number) => {
    if (burnCount >= 15) return { name: "Demon Lord", color: "text-red-300", icon: <Star className="h-5 w-5 text-red-300" /> };
    if (burnCount >= 10) return { name: "Hellfire Master", color: "text-yellow-200", icon: <Star className="h-5 w-5 text-yellow-200" /> };
    if (burnCount >= 5) return { name: "Inferno Adept", color: "text-yellow-300", icon: <Star className="h-5 w-5 text-yellow-300" /> };
    if (burnCount >= 3) return { name: "Flame Apprentice", color: "text-orange-300", icon: <Star className="h-5 w-5 text-orange-300" /> };
    return { name: "Novice Burner", color: "text-orange-400", icon: <Star className="h-5 w-5 text-orange-400" /> };
  };

  // Use uniqueHistory length for rank calculation
  const currentRank = getRank(uniqueHistory.length);
  
  // Calculate progress to next rank
  const getProgressToNextRank = (burnCount: number) => {
    if (burnCount >= 15) return 100; // Already at max rank
    if (burnCount >= 10) return Math.min(100, ((burnCount - 10) / 5) * 100); // Progress to Demon Lord
    if (burnCount >= 5) return Math.min(100, ((burnCount - 5) / 5) * 100); // Progress to Hellfire Master
    if (burnCount >= 3) return Math.min(100, ((burnCount - 3) / 2) * 100); // Progress to Inferno Adept
    if (burnCount >= 1) return Math.min(100, ((burnCount - 1) / 2) * 100); // Progress to Flame Apprentice
    return 0; // No progress yet
  };

  const progressPercent = getProgressToNextRank(uniqueHistory.length);
  
  // Get next rank name
  const getNextRankName = (burnCount: number) => {
    if (burnCount >= 15) return null; // Already at max rank
    if (burnCount >= 10) return "Demon Lord";
    if (burnCount >= 5) return "Hellfire Master";
    if (burnCount >= 3) return "Inferno Adept";
    if (burnCount >= 1) return "Flame Apprentice";
    return "Novice Burner";
  };

  const nextRank = getNextRankName(uniqueHistory.length);

  // Format sharing text for social media
  const getShareText = () => {
    const emoji = uniqueHistory.length >= 15 ? '🔥👑' : 
                 uniqueHistory.length >= 10 ? '🔥🌟' : 
                 uniqueHistory.length >= 5 ? '🔥✨' : '🔥';
    
    const achievementText = `${emoji} Achievement Unlocked: ${currentRank.name}!\n\n`;
    const statsText = `🏆 Tokens Burned: ${uniqueHistory.length}\n💎 Total Value: ${totalBurned.toFixed(2)}\n`;
    const callToAction = `\n🌐 Join me in cleaning up the blockchain:\n`;
    const hashtags = `\n#TokenBurner #DeFi #CleanBlockchain`;

    return `${achievementText}${statsText}${callToAction}tokenburner.vercel.app${hashtags}`;
  };

  // Share to Twitter/X
  const shareToTwitter = () => {
    const text = getShareText();
    const url = 'https://tokenburner.vercel.app'; // Replace with your actual URL
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  // Share to Warpcast
  const shareToWarpcast = () => {
    const text = getShareText();
    window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Card className="border-orange-900/50 bg-gray-900/90 backdrop-blur-sm shadow-xl">
      <CardHeader className="border-b border-red-900/50 bg-gradient-to-r from-gray-900 to-red-950">
        <div className="flex justify-between items-center">
          <div className="flex flex-col space-y-1">
            <CardTitle className="flex items-center gap-2 text-orange-400 font-cinzel">
              <Flame className="h-6 w-6 text-orange-500" />
              Your Burn History
            </CardTitle>
            <CardDescription className="text-orange-200">
              Your local burn history and achievements
            </CardDescription>
          </div>

          <div className="flex gap-2">
            {hasDuplicates && (
              <Button
                variant="outline"
                size="sm"
                onClick={cleanupDuplicates}
                className="bg-yellow-900/30 border-yellow-700 text-yellow-400 hover:bg-yellow-900/50 hover:text-yellow-300"
                title="Remove duplicate entries from history"
              >
                <Filter className="h-4 w-4 mr-2" />
                Remove Duplicates
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to clear your burn history? This action cannot be undone.')) {
                  resetStore();
                }
              }}
              className="bg-red-900 hover:bg-red-800"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Data
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {hasDuplicates && (
          <div className="mb-4 p-3 border border-yellow-600/50 rounded-md bg-yellow-900/20 text-yellow-200 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p>Duplicate entries have been detected in your history. These duplications may have occurred due to a previous issue when loading unburned tokens. Use the &quot;Remove Duplicates&quot; button to clean your history.</p>
            </div>
          </div>
        )}

        {uniqueHistory.length === 0 ? (
          <p className="text-center text-orange-200/60 py-4">
            No tokens burned yet. Start burning those spam tokens! 🔥
          </p>
        ) : (
          <>
            {/* Stats and Achievements Card */}
            <div className="mb-6 p-4 border border-orange-900/30 rounded-lg bg-gray-950/70 shadow-inner">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                {/* Rank & Combo Display */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <h3 className="text-lg font-medium text-orange-200">Your Inferno Rank</h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {currentRank.icon}
                    <span className={`text-xl font-bold ${currentRank.color}`}>
                      {currentRank.name}
                    </span>
                  </div>
                  
                  {nextRank && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-orange-200">Progress to {nextRank}</span>
                        <span className="text-orange-200">{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-600 to-red-600 h-2 rounded-full" 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Stats Display */}
                <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l border-orange-900/30 md:pl-4 pt-4 md:pt-0">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-400" />
                    <h3 className="text-lg font-medium text-orange-200">Your Stats</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-orange-300">Total Burned</p>
                      <p className="text-xl font-bold text-orange-100">{uniqueHistory.length} tokens</p>
                    </div>
                    <div>
                      <p className="text-sm text-orange-300">Value Burned</p>
                      <p className="text-xl font-bold text-orange-100">{totalBurned.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-orange-300">Current Combo</p>
                      <p className="text-xl font-bold text-orange-100">
                        {comboMultiplier > 1 
                          ? `x${comboMultiplier.toFixed(1)}` 
                          : "None"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-orange-300">Last Burn</p>
                      <p className="text-xl font-bold text-orange-100">
                        {uniqueHistory.length > 0 
                          ? formatDistanceToNow(uniqueHistory[0].timestamp, { addSuffix: true }) 
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Share Buttons */}
              {uniqueHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-orange-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Share2 className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-200">Share your achievements</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={shareToTwitter}
                      className="bg-transparent border-blue-700 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                    >
                      <Twitter className="h-4 w-4 mr-2" />
                      Share on X/Twitter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={shareToWarpcast}
                      className="bg-transparent border-purple-700 text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
                    >
                      <Skull className="h-4 w-4 mr-2" />
                      Share on Warpcast
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Burn History List */}
            <h3 className="text-md font-medium text-orange-200 mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Burn Transactions
            </h3>
            <div className="space-y-4">
              {uniqueHistory.map((burn, index) => (
                <div
                  key={`${burn.timestamp}-${index}`}
                  className="flex justify-between items-center p-3 border border-orange-900/20 rounded-lg bg-gray-950/50 hover:bg-gray-950/80 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-orange-300 font-medium">{burn.name}</span>
                    <span className="text-sm text-orange-200/60">
                      {formatDistanceToNow(burn.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400">
                      {burn.value.toFixed(2)} {burn.symbol}
                    </span>
                    {burn.txId && (
                      <a
                        href={getTransactionUrl(burn.txId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 