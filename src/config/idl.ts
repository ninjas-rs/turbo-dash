//@ts-nocheck

export const TurbodashIdl: TurbodashIdl = {
  // address: "A16ypHQTbjj6A3MFeAk8CFpz9G4sPXyxD1jj3YxNw6gm",
  address: "Bkw3hGBupsMdMjxZyS9BYeagK7oBe6wHSTMigYmeip6Z",
  metadata: {
    name: "turbodash",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor",
  },
  instructions: [
    {
      name: "claim_prize",
      discriminator: [157, 233, 139, 121, 246, 62, 234, 235],
      accounts: [
        {
          name: "contest",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 116, 101, 115, 116],
              },
              {
                kind: "account",
                path: "contest.creator",
                account: "ContestState",
              },
              {
                kind: "account",
                path: "contest.id",
                account: "ContestState",
              },
            ],
          },
        },
        {
          name: "player_state",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 108, 97, 121, 101, 114],
              },
              {
                kind: "account",
                path: "winner",
              },
              {
                kind: "account",
                path: "contest.id",
                account: "ContestState",
              },
            ],
          },
        },
        {
          name: "winner",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
    {
      name: "create_contest",
      discriminator: [129, 189, 164, 27, 152, 242, 123, 93],
      accounts: [
        {
          name: "contest",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 116, 101, 115, 116],
              },
              {
                kind: "account",
                path: "authority",
              },
              {
                kind: "account",
                path: "contest_counter.count",
                account: "ContestCounter",
              },
            ],
          },
        },
        {
          name: "contest_counter",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99, 111, 110, 116, 101, 115, 116, 95, 99, 111, 117, 110, 116,
                  101, 114,
                ],
              },
            ],
          },
        },
        {
          name: "team_account",
          writable: true,
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "global_account",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [103, 108, 111, 98, 97, 108],
              },
            ],
          },
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "contest_duration",
          type: "i64",
        },
      ],
    },
    {
      name: "initialize",
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      accounts: [
        {
          name: "global",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [103, 108, 111, 98, 97, 108],
              },
            ],
          },
        },
        {
          name: "payer",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "server_key",
          type: "pubkey",
        },
        {
          name: "fees_account",
          type: "pubkey",
        },
      ],
    },
    {
      name: "initialize_counter",
      discriminator: [67, 89, 100, 87, 231, 172, 35, 124],
      accounts: [
        {
          name: "contest_counter",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99, 111, 110, 116, 101, 115, 116, 95, 99, 111, 117, 110, 116,
                  101, 114,
                ],
              },
            ],
          },
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
    {
      name: "join_contest",
      discriminator: [247, 243, 77, 111, 247, 254, 100, 133],
      accounts: [
        {
          name: "contest",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 116, 101, 115, 116],
              },
              {
                kind: "account",
                path: "contest.creator",
                account: "ContestState",
              },
              {
                kind: "account",
                path: "contest.id",
                account: "ContestState",
              },
            ],
          },
        },
        {
          name: "contest_counter",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99, 111, 110, 116, 101, 115, 116, 95, 99, 111, 117, 110, 116,
                  101, 114,
                ],
              },
            ],
          },
        },
        {
          name: "player",
          writable: true,
          signer: true,
        },
        {
          name: "player_state",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 108, 97, 121, 101, 114],
              },
              {
                kind: "account",
                path: "player",
              },
              {
                kind: "account",
                path: "contest.id",
                account: "ContestState",
              },
            ],
          },
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
    {
      name: "process_admin_action",
      discriminator: [235, 232, 19, 89, 58, 78, 208, 47],
      accounts: [
        {
          name: "global_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [103, 108, 111, 98, 97, 108],
              },
            ],
          },
        },
        {
          name: "admin",
          writable: true,
          signer: true,
        },
      ],
      args: [
        {
          name: "action",
          type: {
            defined: {
              name: "AdminAction",
            },
          },
        },
      ],
    },
    {
      name: "record_progress",
      discriminator: [116, 126, 203, 83, 23, 114, 161, 110],
      accounts: [
        {
          name: "contest",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 116, 101, 115, 116],
              },
              {
                kind: "account",
                path: "contest.creator",
                account: "ContestState",
              },
              {
                kind: "account",
                path: "contest.id",
                account: "ContestState",
              },
            ],
          },
        },
        {
          name: "player",
          writable: true,
          signer: true,
        },
        {
          name: "player_state",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 108, 97, 121, 101, 114],
              },
              {
                kind: "account",
                path: "player",
              },
              {
                kind: "account",
                path: "contest.id",
                account: "ContestState",
              },
            ],
          },
        },
        {
          name: "backend_signer",
          signer: true,
        },
        {
          name: "fees_account",
          writable: true,
        },
        {
          name: "global_account",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [103, 108, 111, 98, 97, 108],
              },
            ],
          },
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "ix_sysvar",
          docs: [
            "the supplied Sysvar could be anything else.",
            "The Instruction Sysvar has not been implemented",
            "in the Anchor framework yet, so this is the safe approach.",
          ],
          address: "Sysvar1nstructions1111111111111111111111111",
        },
      ],
      args: [
        {
          name: "fee_in_lamports",
          type: "u64",
        },
        {
          name: "pubkey",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "msg",
          type: "bytes",
        },
        {
          name: "sig",
          type: {
            array: ["u8", 64],
          },
        },
      ],
    },
    {
      name: "refill_lifetimes",
      discriminator: [222, 23, 157, 35, 222, 98, 102, 150],
      accounts: [
        {
          name: "player",
          writable: true,
          signer: true,
        },
        {
          name: "player_state",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 108, 97, 121, 101, 114],
              },
              {
                kind: "account",
                path: "player",
              },
              {
                kind: "account",
                path: "contest.id",
                account: "ContestState",
              },
            ],
          },
        },
        {
          name: "contest",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 116, 101, 115, 116],
              },
              {
                kind: "account",
                path: "contest.creator",
                account: "ContestState",
              },
              {
                kind: "account",
                path: "contest.id",
                account: "ContestState",
              },
            ],
          },
        },
        {
          name: "backend_signer",
          signer: true,
        },
        {
          name: "global_account",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [103, 108, 111, 98, 97, 108],
              },
            ],
          },
        },
        {
          name: "team_account",
          writable: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "ix_sysvar",
          docs: [
            "the supplied Sysvar could be anything else.",
            "The Instruction Sysvar has not been implemented",
            "in the Anchor framework yet, so this is the safe approach.",
          ],
          address: "Sysvar1nstructions1111111111111111111111111",
        },
      ],
      args: [
        {
          name: "fee_in_lamports",
          type: "u64",
        },
        {
          name: "should_continue",
          type: "bool",
        },
        {
          name: "pubkey",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "msg",
          type: "bytes",
        },
        {
          name: "sig",
          type: {
            array: ["u8", 64],
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "ContestCounter",
      discriminator: [5, 119, 118, 174, 165, 15, 243, 166],
    },
    {
      name: "ContestState",
      discriminator: [196, 14, 19, 228, 209, 39, 0, 4],
    },
    {
      name: "GlobalAccount",
      discriminator: [129, 105, 124, 171, 189, 42, 108, 69],
    },
    {
      name: "PlayerState",
      discriminator: [56, 3, 60, 86, 174, 16, 244, 195],
    },
  ],
  events: [
    {
      name: "ContestJoinEvent",
      discriminator: [150, 177, 190, 122, 51, 206, 120, 16],
    },
    {
      name: "LevelCrossedEvent",
      discriminator: [65, 65, 176, 87, 103, 58, 68, 128],
    },
    {
      name: "PlayerRefilled",
      discriminator: [77, 217, 70, 63, 131, 71, 226, 193],
    },
    {
      name: "PrizeClaimedEvent",
      discriminator: [197, 70, 85, 234, 235, 8, 6, 241],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "ContestExpired",
      msg: "Contest has expired",
    },
    {
      code: 6001,
      name: "ContestNotExpired",
      msg: "Contest is still ongoing",
    },
    {
      code: 6002,
      name: "NotHighestScorer",
      msg: "You are not the highest scorer",
    },
    {
      code: 6003,
      name: "InsufficientFunds",
      msg: "Insufficient funds to join contest",
    },
    {
      code: 6004,
      name: "InvalidFee",
      msg: "InvalidFee Provided",
    },
    {
      code: 6005,
      name: "SigVerificationFailed",
      msg: "Invalid Signature",
    },
    {
      code: 6006,
      name: "Unauthorised",
      msg: "Unauthorised",
    },
  ],
  types: [
    {
      name: "AdminAction",
      type: {
        kind: "enum",
        variants: [
          {
            name: "UpdateServerKey",
            fields: ["pubkey"],
          },
          {
            name: "UpdateAdminKey",
            fields: ["pubkey"],
          },
          {
            name: "UpdateFeesAccount",
            fields: ["pubkey"],
          },
        ],
      },
    },
    {
      name: "ContestCounter",
      type: {
        kind: "struct",
        fields: [
          {
            name: "count",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "ContestJoinEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "player",
            type: "pubkey",
          },
          {
            name: "contest",
            type: "pubkey",
          },
        ],
      },
    },
    {
      name: "ContestState",
      type: {
        kind: "struct",
        fields: [
          {
            name: "id",
            type: "u64",
          },
          {
            name: "creator",
            type: "pubkey",
          },
          {
            name: "start_time",
            type: "i64",
          },
          {
            name: "end_time",
            type: "i64",
          },
          {
            name: "prize_pool",
            type: "u64",
          },
          {
            name: "highest_score",
            type: "u64",
          },
          {
            name: "leader",
            type: "pubkey",
          },
          {
            name: "team_account",
            type: "pubkey",
          },
          {
            name: "total_participants",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "GlobalAccount",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "pubkey",
          },
          {
            name: "server_key",
            type: "pubkey",
          },
          {
            name: "fees_account",
            type: "pubkey",
          },
        ],
      },
    },
    {
      name: "LevelCrossedEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "contest_id",
            type: "u64",
          },
          {
            name: "player",
            type: "pubkey",
          },
          {
            name: "score",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "PlayerRefilled",
      type: {
        kind: "struct",
        fields: [
          {
            name: "contest_id",
            type: "u64",
          },
          {
            name: "player",
            type: "pubkey",
          },
        ],
      },
    },
    {
      name: "PlayerState",
      type: {
        kind: "struct",
        fields: [
          {
            name: "owner",
            type: "pubkey",
          },
          {
            name: "contest_id",
            type: "u64",
          },
          {
            name: "current_score",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "PrizeClaimedEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "winner",
            type: "pubkey",
          },
          {
            name: "prize_amount",
            type: "u64",
          },
        ],
      },
    },
  ],
} as const;

export type TurbodashIdl = {
  address: "Bkw3hGBupsMdMjxZyS9BYeagK7oBe6wHSTMigYmeip6Z";
  metadata: {
    name: "turbodash";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "claimPrize";
      discriminator: [157, 233, 139, 121, 246, 62, 234, 235];
      accounts: [
        {
          name: "contest";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 116, 101, 115, 116];
              },
              {
                kind: "account";
                path: "contest.creator";
                account: "contestState";
              },
              {
                kind: "account";
                path: "contest.id";
                account: "contestState";
              },
            ];
          };
        },
        {
          name: "playerState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 121, 101, 114];
              },
              {
                kind: "account";
                path: "winner";
              },
              {
                kind: "account";
                path: "contest.id";
                account: "contestState";
              },
            ];
          };
        },
        {
          name: "winner";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "createContest";
      discriminator: [129, 189, 164, 27, 152, 242, 123, 93];
      accounts: [
        {
          name: "contest";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 116, 101, 115, 116];
              },
              {
                kind: "account";
                path: "authority";
              },
              {
                kind: "account";
                path: "contest_counter.count";
                account: "contestCounter";
              },
            ];
          };
        },
        {
          name: "contestCounter";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114,
                ];
              },
            ];
          };
        },
        {
          name: "teamAccount";
          writable: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "globalAccount";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108];
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "contestDuration";
          type: "i64";
        },
      ];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "global";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108];
              },
            ];
          };
        },
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "serverKey";
          type: "pubkey";
        },
        {
          name: "feesAccount";
          type: "pubkey";
        },
      ];
    },
    {
      name: "initializeCounter";
      discriminator: [67, 89, 100, 87, 231, 172, 35, 124];
      accounts: [
        {
          name: "contestCounter";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114,
                ];
              },
            ];
          };
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "joinContest";
      discriminator: [247, 243, 77, 111, 247, 254, 100, 133];
      accounts: [
        {
          name: "contest";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 116, 101, 115, 116];
              },
              {
                kind: "account";
                path: "contest.creator";
                account: "contestState";
              },
              {
                kind: "account";
                path: "contest.id";
                account: "contestState";
              },
            ];
          };
        },
        {
          name: "contestCounter";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114,
                ];
              },
            ];
          };
        },
        {
          name: "player";
          writable: true;
          signer: true;
        },
        {
          name: "playerState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 121, 101, 114];
              },
              {
                kind: "account";
                path: "player";
              },
              {
                kind: "account";
                path: "contest.id";
                account: "contestState";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "processAdminAction";
      discriminator: [235, 232, 19, 89, 58, 78, 208, 47];
      accounts: [
        {
          name: "globalAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108];
              },
            ];
          };
        },
        {
          name: "admin";
          writable: true;
          signer: true;
        },
      ];
      args: [
        {
          name: "action";
          type: {
            defined: {
              name: "adminAction";
            };
          };
        },
      ];
    },
    {
      name: "recordProgress";
      discriminator: [116, 126, 203, 83, 23, 114, 161, 110];
      accounts: [
        {
          name: "contest";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 116, 101, 115, 116];
              },
              {
                kind: "account";
                path: "contest.creator";
                account: "contestState";
              },
              {
                kind: "account";
                path: "contest.id";
                account: "contestState";
              },
            ];
          };
        },
        {
          name: "player";
          writable: true;
          signer: true;
        },
        {
          name: "playerState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 121, 101, 114];
              },
              {
                kind: "account";
                path: "player";
              },
              {
                kind: "account";
                path: "contest.id";
                account: "contestState";
              },
            ];
          };
        },
        {
          name: "backendSigner";
          signer: true;
        },
        {
          name: "feesAccount";
          writable: true;
        },
        {
          name: "globalAccount";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108];
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "ixSysvar";
          docs: [
            "the supplied Sysvar could be anything else.",
            "The Instruction Sysvar has not been implemented",
            "in the Anchor framework yet, so this is the safe approach.",
          ];
          address: "Sysvar1nstructions1111111111111111111111111";
        },
      ];
      args: [
        {
          name: "feeInLamports";
          type: "u64";
        },
        {
          name: "pubkey";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "msg";
          type: "bytes";
        },
        {
          name: "sig";
          type: {
            array: ["u8", 64];
          };
        },
      ];
    },
    {
      name: "refillLifetimes";
      discriminator: [222, 23, 157, 35, 222, 98, 102, 150];
      accounts: [
        {
          name: "player";
          writable: true;
          signer: true;
        },
        {
          name: "playerState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 108, 97, 121, 101, 114];
              },
              {
                kind: "account";
                path: "player";
              },
              {
                kind: "account";
                path: "contest.id";
                account: "contestState";
              },
            ];
          };
        },
        {
          name: "contest";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 116, 101, 115, 116];
              },
              {
                kind: "account";
                path: "contest.creator";
                account: "contestState";
              },
              {
                kind: "account";
                path: "contest.id";
                account: "contestState";
              },
            ];
          };
        },
        {
          name: "backendSigner";
          signer: true;
        },
        {
          name: "globalAccount";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108];
              },
            ];
          };
        },
        {
          name: "teamAccount";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "ixSysvar";
          docs: [
            "the supplied Sysvar could be anything else.",
            "The Instruction Sysvar has not been implemented",
            "in the Anchor framework yet, so this is the safe approach.",
          ];
          address: "Sysvar1nstructions1111111111111111111111111";
        },
      ];
      args: [
        {
          name: "feeInLamports";
          type: "u64";
        },
        {
          name: "shouldContinue";
          type: "bool";
        },
        {
          name: "pubkey";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "msg";
          type: "bytes";
        },
        {
          name: "sig";
          type: {
            array: ["u8", 64];
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: "contestCounter";
      discriminator: [5, 119, 118, 174, 165, 15, 243, 166];
    },
    {
      name: "contestState";
      discriminator: [196, 14, 19, 228, 209, 39, 0, 4];
    },
    {
      name: "globalAccount";
      discriminator: [129, 105, 124, 171, 189, 42, 108, 69];
    },
    {
      name: "playerState";
      discriminator: [56, 3, 60, 86, 174, 16, 244, 195];
    },
  ];
  events: [
    {
      name: "contestJoinEvent";
      discriminator: [150, 177, 190, 122, 51, 206, 120, 16];
    },
    {
      name: "levelCrossedEvent";
      discriminator: [65, 65, 176, 87, 103, 58, 68, 128];
    },
    {
      name: "playerRefilled";
      discriminator: [77, 217, 70, 63, 131, 71, 226, 193];
    },
    {
      name: "prizeClaimedEvent";
      discriminator: [197, 70, 85, 234, 235, 8, 6, 241];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "contestExpired";
      msg: "Contest has expired";
    },
    {
      code: 6001;
      name: "contestNotExpired";
      msg: "Contest is still ongoing";
    },
    {
      code: 6002;
      name: "notHighestScorer";
      msg: "You are not the highest scorer";
    },
    {
      code: 6003;
      name: "insufficientFunds";
      msg: "Insufficient funds to join contest";
    },
    {
      code: 6004;
      name: "invalidFee";
      msg: "InvalidFee Provided";
    },
    {
      code: 6005;
      name: "sigVerificationFailed";
      msg: "Invalid Signature";
    },
    {
      code: 6006;
      name: "unauthorised";
      msg: "unauthorised";
    },
  ];
  types: [
    {
      name: "adminAction";
      type: {
        kind: "enum";
        variants: [
          {
            name: "updateServerKey";
            fields: ["pubkey"];
          },
          {
            name: "updateAdminKey";
            fields: ["pubkey"];
          },
          {
            name: "updateFeesAccount";
            fields: ["pubkey"];
          },
        ];
      };
    },
    {
      name: "contestCounter";
      type: {
        kind: "struct";
        fields: [
          {
            name: "count";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "contestJoinEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "player";
            type: "pubkey";
          },
          {
            name: "contest";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "contestState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "id";
            type: "u64";
          },
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "startTime";
            type: "i64";
          },
          {
            name: "endTime";
            type: "i64";
          },
          {
            name: "prizePool";
            type: "u64";
          },
          {
            name: "highestScore";
            type: "u64";
          },
          {
            name: "leader";
            type: "pubkey";
          },
          {
            name: "teamAccount";
            type: "pubkey";
          },
          {
            name: "totalParticipants";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "globalAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "serverKey";
            type: "pubkey";
          },
          {
            name: "feesAccount";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "levelCrossedEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "contestId";
            type: "u64";
          },
          {
            name: "player";
            type: "pubkey";
          },
          {
            name: "score";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "playerRefilled";
      type: {
        kind: "struct";
        fields: [
          {
            name: "contestId";
            type: "u64";
          },
          {
            name: "player";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "playerState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "contestId";
            type: "u64";
          },
          {
            name: "currentScore";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "prizeClaimedEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "winner";
            type: "pubkey";
          },
          {
            name: "prizeAmount";
            type: "u64";
          },
        ];
      };
    },
  ];
};
