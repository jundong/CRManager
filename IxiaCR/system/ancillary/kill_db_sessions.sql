-- Delete stale sessions for Ixia
SELECT pg_terminate_backend( procpid ) FROM pg_stat_activity WHERE procpid <> pg_backend_pid( ) AND datname = current_database( );