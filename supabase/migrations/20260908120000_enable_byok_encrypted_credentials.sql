alter table public.user_api_credentials
drop constraint user_api_credentials_step_13_no_secret_check;

alter table public.user_api_credentials
add constraint user_api_credentials_crypto_material_check check (
  (
    ciphertext is null
    and iv is null
    and auth_tag is null
    and key_version is null
    and secret_last4 is null
    and validation_status = 'untested'
    and last_validated_at is null
  )
  or
  (
    ciphertext is not null
    and iv is not null
    and auth_tag is not null
    and key_version between 1 and 2147483647
    and (secret_last4 is null or char_length(secret_last4) = 4)
    and case
      when ciphertext ~ '^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'
        and ciphertext <> ''
      then length(decode(ciphertext, 'base64')) between 1 and 16384
      else false
    end
    and iv ~ '^[A-Za-z0-9+/]{16}$'
    and auth_tag ~ '^[A-Za-z0-9+/]{22}==$'
    and (
      (validation_status = 'untested' and last_validated_at is null)
      or (validation_status in ('valid', 'invalid', 'error') and last_validated_at is not null)
    )
  )
);

-- The backend must know id before encryption because credentialId is bound into
-- the AAD. These remain column-level grants and every write still runs under the
-- existing authenticated ownership policies and FORCE RLS.
grant insert (
  id,
  ciphertext,
  iv,
  auth_tag,
  key_version,
  secret_last4,
  validation_status,
  last_validated_at
) on public.user_api_credentials to authenticated;

grant update (
  ciphertext,
  iv,
  auth_tag,
  key_version,
  secret_last4,
  validation_status,
  last_validated_at
) on public.user_api_credentials to authenticated;
