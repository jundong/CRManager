-- Delete sessions for Ixia
UPDATE users SET last_login = now() - INTERVAL '1 month', session_id = '', remote_addr= '';