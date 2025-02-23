import React, { useState, useEffect, JSX } from 'react';
import { BsArrowLeft, BsArrowRight } from 'react-icons/bs';
import PixelatedCard from './pixelated-card';
import { Card, Button } from 'pixel-retroui';
import { formatAddress, formatScore } from '@/utils/common';

const ITEMS_PER_PAGE = 10;

interface LeaderboardItem {
  address: string;
  score: number;
}

function Leaderboard(): JSX.Element {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(0);

  function fetchLeaderboard(): void {
    setLoading(true);
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          setLeaderboard(data.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const totalPages: number = leaderboard ? Math.ceil(leaderboard.length / ITEMS_PER_PAGE) : 0;
  const paginatedData: LeaderboardItem[] | undefined = leaderboard?.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <PixelatedCard className="h-96">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-48 bg-green-600 rounded" />
            <div className="h-6 w-64 bg-green-500 rounded" />
            <div className="h-6 w-56 bg-green-500 rounded" />
            <div className="h-6 w-60 bg-green-500 rounded" />
          </div>
        </div>
      </PixelatedCard>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <PixelatedCard className="h-96">
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-xl font-bold text-green-600">No Ongoing Contest</h2>
          <p className="text-green-500 mt-2">Check back later for updates!</p>
        </div>
      </PixelatedCard>
    );
  }

  return (
    <PixelatedCard className="h-96">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-2">
          <Card
            textColor="black"
            shadowColor="#59b726"
            borderColor="#26541B"
            bg="#239B3F"
            className="!border-0 w-full p-1 text-sm text-center"
          >
            <div className="grid grid-cols-3 w-full items-center px-2">
              <h2 className="text-left font-semibold">Rank</h2>
              <h2 className="text-center font-semibold">Address</h2>
              <h2 className="text-right font-semibold">Score</h2>
            </div>
          </Card>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-200 pr-2">
          {paginatedData?.map((item: LeaderboardItem, index: number) => {
            const globalRank: number = currentPage * ITEMS_PER_PAGE + index + 1;
            return (
              <Card
                key={index}
                bg="#239B3F"
                textColor="black"
                shadowColor="#59b726"
                borderColor="#26541B"
                className="p-1 text-sm hover:brightness-110 transition-all"
              >
                <div className="grid grid-cols-3 w-full items-center px-2">
                  <span className="text-left font-bold">#{globalRank}</span>
                  <span className="text-center font-mono truncate">
                    {formatAddress(item.address)}
                  </span>
                  <span className="text-right tabular-nums">
                    {formatScore(item.score)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Footer with Pagination */}
        <div className="mt-2 flex justify-end space-x-2">
          <Button 
            bg="#59b726"
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className={`p-2 ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
          >
            <BsArrowLeft />
          </Button>
          <Button 
            bg="#59b726"
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className={`p-2 ${currentPage === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
          >
            <BsArrowRight />
          </Button>
        </div>
      </div>
    </PixelatedCard>
  );
}

export default Leaderboard;