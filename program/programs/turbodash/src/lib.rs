use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::sysvar::instructions::{load_instruction_at_checked, ID as IX_ID};
mod errors;
mod utils;
use errors::*;

declare_id!("5h1temPzdsFNwSFNme9Hh2xFtYrjQBy38qZKeiryzPMa");

#[program]
pub mod turbodash {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        server_key: Pubkey,
        fees_account: Pubkey,
    ) -> Result<()> {
        let global_account = &mut ctx.accounts.global;
        global_account.authority = *ctx.accounts.payer.key;
        global_account.server_key = server_key;
        global_account.fees_account = fees_account;
        Ok(())
    }

    pub fn initialize_counter(ctx: Context<InitializeCounter>) -> Result<()> {
        ctx.accounts.contest_counter.count = 0;
        Ok(())
    }

    pub fn create_contest(ctx: Context<CreateContest>, contest_duration: i64) -> Result<()> {
        let counter = &mut ctx.accounts.contest_counter;

        require!(
            ctx.accounts.authority.key() == ctx.accounts.global_account.authority.key(),
            GameError::Unauthorised
        );
        let contest = &mut ctx.accounts.contest;
        let start_time = Clock::get()?.unix_timestamp;
        contest.id = counter.count;
        contest.creator = ctx.accounts.authority.key();
        contest.start_time = start_time;
        contest.end_time = start_time + contest_duration;
        contest.prize_pool = 0;
        contest.total_participants = 0;
        contest.highest_score = 0;
        contest.leader = Pubkey::default();
        contest.team_account = ctx.accounts.team_account.key();

        counter.increment()?;

        Ok(())
    }

    pub fn join_contest(ctx: Context<JoinContest>) -> Result<()> {
        let player_state = &mut ctx.accounts.player_state;

        let contest = &mut ctx.accounts.contest;

        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time <= contest.end_time, GameError::ContestExpired);

        let contest_key = contest.key();

        player_state.contest_id = contest.id;
        player_state.current_score = 0;
        player_state.owner = ctx.accounts.player.key();

        contest.total_participants += 1;

        emit!(ContestJoinEvent {
            player: ctx.accounts.player.key(),
            contest: contest_key,
        });

        Ok(())
    }

    pub fn record_progress(
        ctx: Context<RecordProgress>,
        fee_in_lamports: u64,
        pubkey: [u8; 32],
        msg: Vec<u8>,
        sig: [u8; 64],
    ) -> Result<()> {
        let ix: Instruction = load_instruction_at_checked(0, &ctx.accounts.ix_sysvar)?;

        utils::verify_ed25519_ix(&ix, &pubkey, &msg, &sig)?;

        let contest_key = ctx.accounts.contest.key();
        let fees_account = &mut ctx.accounts.fees_account;

        let player_state = &mut ctx.accounts.player_state;
        let contest = &mut ctx.accounts.contest;

        let current_time = Clock::get()?.unix_timestamp;

        require!(current_time <= contest.end_time, GameError::ContestExpired);

        require!(fee_in_lamports > 0, GameError::InvalidFee);

        player_state.increment_score()?;

        let c_s = player_state.current_score;

        if c_s > contest.highest_score {
            contest.highest_score = c_s;
            contest.leader = ctx.accounts.player.key();
        }

        let contest_share = fee_in_lamports.saturating_mul(80) / 100;
        let team_share = fee_in_lamports.saturating_mul(20) / 100;

        let contest_transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &contest_key,
            contest_share,
        );

        anchor_lang::solana_program::program::invoke(
            &contest_transfer_ix,
            &[
                ctx.accounts.player.to_account_info(),
                contest.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let team_transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &fees_account.key(),
            team_share,
        );

        anchor_lang::solana_program::program::invoke(
            &team_transfer_ix,
            &[
                ctx.accounts.player.to_account_info(),
                fees_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        contest.prize_pool += contest_share;

        emit!(LevelCrossedEvent {
            contest_id: contest.id,
            player: ctx.accounts.player.key(),
            score: c_s
        });

        Ok(())
    }

    pub fn refill_lifetimes(
        ctx: Context<RefillLifeTime>,
        fee_in_lamports: u64,
        should_continue: bool,
        pubkey: [u8; 32],
        msg: Vec<u8>,
        sig: [u8; 64],
    ) -> Result<()> {
        let ix: Instruction = load_instruction_at_checked(0, &ctx.accounts.ix_sysvar)?;

        utils::verify_ed25519_ix(&ix, &pubkey, &msg, &sig)?;
        let player_state = &mut ctx.accounts.player_state;

        require!(fee_in_lamports > 0, GameError::InvalidFee);

        let contest_share = fee_in_lamports.saturating_mul(80) / 100;
        let team_share = fee_in_lamports.saturating_mul(20) / 100;

        let contest_transfer_instruction =
            anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.player.key(),
                &ctx.accounts.contest.key(),
                contest_share,
            );
        anchor_lang::solana_program::program::invoke(
            &contest_transfer_instruction,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.contest.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let team_transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.team_account.key(),
            team_share,
        );

        anchor_lang::solana_program::program::invoke(
            &team_transfer_instruction,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.team_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        player_state.current_score = if should_continue {
            player_state.current_score
        } else {
            0
        };

        ctx.accounts.contest.prize_pool += contest_share;

        emit!(PlayerRefilled {
            contest_id: ctx.accounts.contest.id,
            player: ctx.accounts.player_state.key(),
        });
        Ok(())
    }

    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let contest = &mut ctx.accounts.contest;
        let player_state = &ctx.accounts.player_state;

        let current_time = Clock::get()?.unix_timestamp;

        require!(
            current_time > contest.end_time,
            GameError::ContestNotExpired
        );

        require!(
            ctx.accounts.winner.key() == contest.leader.key(),
            GameError::NotHighestScorer
        );

        require!(
            player_state.owner.key() == ctx.accounts.winner.key(),
            GameError::NotHighestScorer
        );

        let prize_to_transfer = contest.prize_pool;

        contest.prize_pool = 0;

        **ctx
            .accounts
            .contest
            .to_account_info()
            .try_borrow_mut_lamports()? -= prize_to_transfer;

        **ctx.accounts.winner.try_borrow_mut_lamports()? += prize_to_transfer;

        emit!(PrizeClaimedEvent {
            winner: ctx.accounts.winner.key(),
            prize_amount: prize_to_transfer
        });

        Ok(())
    }

    pub fn process_admin_action(ctx: Context<UpdateConfig>, action: AdminAction) -> Result<()> {
        let global_account = &mut ctx.accounts.global_account;

        require!(
            global_account.authority == *ctx.accounts.admin.key,
            GameError::Unauthorised
        );

        match action {
            AdminAction::UpdateAdminKey(new_admin_key) => global_account.authority = new_admin_key,
            AdminAction::UpdateFeesAccount(new_fee_key) => {
                global_account.fees_account = new_fee_key
            }
            AdminAction::UpdateServerKey(new_server_key) => {
                global_account.server_key = new_server_key
            }
        }

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum AdminAction {
    UpdateServerKey(Pubkey),
    UpdateAdminKey(Pubkey),
    UpdateFeesAccount(Pubkey),
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"global" ],
        bump
    )]
    pub global_account: Account<'info, GlobalAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = GlobalAccount::SIZE,
        seeds = [b"global"],
        bump
    )]
    pub global: Account<'info, GlobalAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefillLifeTime<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut,
        seeds=[b"player",player.key().as_ref(),&contest.id.to_le_bytes()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,
    #[account(mut,
      seeds=[b"contest",contest.creator.key().as_ref(),&contest.id.to_le_bytes()],
      bump
    )]
    pub contest: Account<'info, ContestState>,
    #[account(
        constraint = backend_signer.key() == global_account.server_key.key()
    )]
    pub backend_signer: Signer<'info>,
    #[account(
        seeds = [b"global"],
        bump
    )]
    pub global_account: Account<'info, GlobalAccount>,
    ///CHECK: ETH transfer to team account
    #[account(
        mut,
        constraint = team_account.key() == global_account.fees_account.key()
    )]
    pub team_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,

    /// CHECK: The address check is needed because otherwise
    /// the supplied Sysvar could be anything else.
    /// The Instruction Sysvar has not been implemented
    /// in the Anchor framework yet, so this is the safe approach.
    #[account(address = IX_ID)]
    pub ix_sysvar: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct InitializeCounter<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"contest_counter"],
        bump,
        space = ContestCounter::SIZE
    )]
    pub contest_counter: Account<'info, ContestCounter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CreateContest<'info> {
    #[account(
        init,
        payer = authority,
        seeds=[b"contest",authority.key().as_ref(),&contest_counter.count.to_le_bytes()],
        space = ContestState::SIZE,
        bump
    )]
    pub contest: Account<'info, ContestState>,
    #[account(
        mut,
        seeds = [b"contest_counter"],
        bump
    )]
    pub contest_counter: Account<'info, ContestCounter>,
    ///CHECK: ETH transfer to Team Accounts
    #[account(
        mut,
        constraint = team_account.key() == global_account.fees_account.key()
    )]
    pub team_account: AccountInfo<'info>,
    #[account(mut,
        constraint = authority.key() == global_account.authority.key(),
        )]
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"global"],
        bump
    )]
    pub global_account: Account<'info, GlobalAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinContest<'info> {
    #[account(mut,
      seeds=[b"contest",contest.creator.key().as_ref(),&contest.id.to_le_bytes()],
      bump
    )]
    pub contest: Account<'info, ContestState>,
    #[account(
        mut,
        seeds = [b"contest_counter"],
        bump
    )]
    pub contest_counter: Account<'info, ContestCounter>,
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init,
        payer = player,
        seeds=[b"player",player.key().as_ref(),&contest.id.to_le_bytes()],
        space = PlayerState::SIZE,
        bump
    )]
    pub player_state: Account<'info, PlayerState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordProgress<'info> {
    #[account(mut,
      seeds=[b"contest",contest.creator.key().as_ref(),&contest.id.to_le_bytes()],
      bump
    )]
    pub contest: Account<'info, ContestState>,

    #[account(mut)]
    pub player: Signer<'info>,

    #[account(mut,
        seeds=[b"player",player.key().as_ref(),&contest.id.to_le_bytes()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,

    #[account(
        constraint = backend_signer.key() == global_account.server_key.key()
    )]
    pub backend_signer: Signer<'info>,

    ///CHECK: ETH transfer to Team Accounts
    #[account(mut,
        constraint = fees_account.key() == global_account.fees_account.key()
    )]
    pub fees_account: AccountInfo<'info>,

    #[account(
        seeds = [b"global"],
        bump
    )]
    pub global_account: Account<'info, GlobalAccount>,

    pub system_program: Program<'info, System>,

    /// CHECK: The address check is needed because otherwise
    /// the supplied Sysvar could be anything else.
    /// The Instruction Sysvar has not been implemented
    /// in the Anchor framework yet, so this is the safe approach.
    #[account(address = IX_ID)]
    pub ix_sysvar: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut,
      seeds=[b"contest",contest.creator.key().as_ref(),&contest.id.to_le_bytes()],
      bump
    )]
    pub contest: Account<'info, ContestState>,
    #[account(mut,
        seeds=[b"player",winner.key().as_ref(),&contest.id.to_le_bytes()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,
    #[account(mut)]
    pub winner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct GlobalAccount {
    pub authority: Pubkey,
    pub server_key: Pubkey,
    pub fees_account: Pubkey,
}

impl GlobalAccount {
    pub const SIZE: usize = 8 + (32 * 3);
}

#[account]
pub struct ContestCounter {
    pub count: u64,
}

impl ContestCounter {
    pub const SIZE: usize = 8 + 8;

    pub fn increment(&mut self) -> Result<()> {
        self.count += 1;
        Ok(())
    }
}

#[account]
pub struct ContestState {
    pub id: u64,
    pub creator: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub prize_pool: u64,
    pub highest_score: u64,
    pub leader: Pubkey,
    pub team_account: Pubkey,
    pub total_participants: u64,
}

impl ContestState {
    pub const SIZE: usize = 8 + 8 + 32 + 8 + 8 + 8 + 8 + 32 + 32 + 8;
}

#[account]
pub struct PlayerState {
    pub owner: Pubkey,
    pub contest_id: u64,
    pub current_score: u64,
}

impl PlayerState {
    pub const SIZE: usize = 8 + 32 + 8 + 8;

    pub fn increment_score(&mut self) -> Result<()> {
        self.current_score += 10;
        Ok(())
    }
}

#[event]
pub struct ContestJoinEvent {
    pub player: Pubkey,
    pub contest: Pubkey,
}

#[event]
pub struct LevelCrossedEvent {
    pub contest_id: u64,
    pub player: Pubkey,
    pub score: u64,
}

#[event]
pub struct PlayerRefilled {
    pub contest_id: u64,
    pub player: Pubkey,
}

#[event]
pub struct PrizeClaimedEvent {
    pub winner: Pubkey,
    pub prize_amount: u64,
}
