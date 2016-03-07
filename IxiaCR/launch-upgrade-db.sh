#!/bin/sh

if [ -e $VENV/bin/activate ]; then
        . $VENV/bin/activate
fi

$VENV/bin/python $IXIACR/system/database_revisions/upgrade_db $IXIACR/production.ini
