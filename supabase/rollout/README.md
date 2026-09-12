# Manual rollout proposals

SQL files in this directory are **not migrations** and are never executed by the
normal Supabase migration sequence. They are reviewed rollout proposals that
must be copied into a new migration only after explicit authorization.

Do not run these files against a remote project as part of `supabase db push`.

Current proposals:

- `activate_alibaba_us_generation.sql`: regional activation gate for Alibaba/Qwen.
