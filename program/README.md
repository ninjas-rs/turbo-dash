
# TurboDash:


### Contest Lifecycle
- **Initialize Counter:** Set up the contest counter for unique contest IDs.
- **Create Contest:** Define a contest with a start time, end time, and other parameters.
- **Join Contest:** Allow users to participate in active contests.
- **Record Progress:** Log user scores and manage prize pools through fee-sharing mechanisms.
- **Refill Lifetimes:** Enable eliminated players to rejoin contests by paying a fee.
- **Claim Prize:** Award prizes to the highest scorer after contest expiration.

### Administrative Actions
- Update global configurations, such as:
  - Server keys.
  - Administrative keys.
  - Fee distribution accounts.

## Architecture

### Program
The program includes multiple accounts:

1. **Global Account**: Stores the global configuration for the program.
   - Authority: The administrative key.
   - Server Key: Backend server authentication.
   - Fees Account: Account for team fees.

2. **Contest State**: Tracks individual contest details, including:
   - Contest ID
   - Start and end times
   - Prize pool and participation count
   - Current Leader information

3. **Player State**: Stores player-specific data for a contest, such as:
   - Current score
   - Lifelines
   - Elimination status

4. **Contest Counter**: Maintains a running counter to ensure unique contest IDs.

### Fee Distribution
- Contest fees are divided into:
  - 80% to the contest prize pool.
  - 20% to the team account for operational costs.

### Events
The program emits events to facilitate indexing and transparency:
- **ContestJoinEvent**: Triggered when a player joins a contest.
- **LevelCrossedEvent**: Triggered when a player's score is updated.
- **PlayerRefilled**: Triggered when a player refills lifelines.
- **PrizeClaimedEvent**: Triggered when a prize is claimed.

## Usage

### Initialization
1. Deploy the program to the Solana blockchain.
2. Initialize the global account:
   ```
   initialize(global_account: Pubkey, server_key: Pubkey);
   ```

### Contest Management
- **Initialize Counter**
  ```
  initialize_counter(contest_counter: Pubkey);
  ```
- **Create Contest**
  ```
  create_contest(contest_duration: i64);
  ```
- **Join Contest**
  ```
  join_contest(contest: Pubkey, player: Pubkey);
  ```

### Gameplay
- **Record Progress**
  ```
  record_progress(fee_in_lamports: u64, pubkey: [u8; 32], msg: Vec<u8>, sig: [u8; 64]);
  ```
- **Refill Lifelines**
  ```
  refill_lifetimes(fee_in_lamports: u64, should_continue: bool);
  ```

### Prize Claim
- **Claim Prize**
  ```
  claim_prize();
  ```

### Administrative Actions
- **Update Configuration**
  ```
  process_admin_action(action: AdminAction);
  ```

## Error Handling
The program includes comprehensive error handling through custom error codes, such as:
- **ContestExpired**: Attempt to interact with an expired contest.
- **Unauthorised**: Unauthorized access to restricted functions.
- **InvalidFee**: Fee amounts are not valid.
- **NotHighestScorer**: Prize claims by non-leaders.
