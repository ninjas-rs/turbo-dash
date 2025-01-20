use anchor_lang::prelude::*;
#[error_code]
pub enum GameError {
    #[msg("Contest has expired")]
    ContestExpired,
    #[msg("Contest is still ongoing")]
    ContestNotExpired,
    #[msg("You are not the highest scorer")]
    NotHighestScorer,
    #[msg("Insufficient funds to join contest")]
    InsufficientFunds,
    #[msg("InvalidFee Provided")]
    InvalidFee,
    #[msg("Invalid Signature")]
    SigVerificationFailed,
    #[msg("Unauthorised")]
    Unauthorised,
}
