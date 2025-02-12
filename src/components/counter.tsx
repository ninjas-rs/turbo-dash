import React from 'react';
import { Card } from "pixel-retroui";

const TransactionCounter = ({ pendingCount, completedCount }) => {
  return (
    <Card
      bg="#239B3F"
      borderColor="#26541B"
      shadowColor="#59b726"
      className="p-2 flex flex-row space-x-4"
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm">Pending:</span>
        <span className="font-mono text-sm bg-yellow-600 px-2 py-1 rounded">
          {pendingCount}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm">Completed:</span>
        <span className="font-mono text-sm bg-green-700 px-2 py-1 rounded">
          {completedCount}
        </span>
      </div>
    </Card>
  );
};

export default TransactionCounter;