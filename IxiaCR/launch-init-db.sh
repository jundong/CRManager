#!/bin/sh

if [ -e $VENV/bin/activate ]; then
	. $VENV/bin/activate
fi

$VENV/bin/initialize_IxiaCR_db $IXIACR/development.ini