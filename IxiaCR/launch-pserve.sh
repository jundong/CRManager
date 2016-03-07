#!/bin/sh

if [ -e $VENV/bin/activate ]; then
	. $VENV/bin/activate
fi

$VENV/bin/python $IXIACR/system/locale/update_locale $IXIACR/development.ini
$VENV/bin/pserve --reload $IXIACR/development.ini
