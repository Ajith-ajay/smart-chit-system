# Batch Lifecycle

- Due dates activate installments; due-date rollover does not close the previous installment.
- Multiple installments may remain ACTIVE simultaneously while members finish delayed payments.
- Installments 1-3 are kept open while the late-enrollment/catch-up window is available.
- From installment 4 onward, an earlier installment becomes COMPLETED only when every non-cancelled enrollment in that plan has fully paid it.
- Installment 20 becomes COMPLETED after all member balances are settled.
- An enrollment becomes COMPLETED after all 20 scheduled installment balances reach zero.
- A batch becomes COMPLETED only after installment 20 is completed and no ACTIVE enrollment remains.
- Lifecycle processing is idempotent and can be run manually or by the optional background runner.
