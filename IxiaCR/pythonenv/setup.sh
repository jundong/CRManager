#!/bin/sh

rm -rf /local/pythonenv/bin
rm -rf /local/pythonenv/include
rm -rf /local/pythonenv/lib
rm -rf /local/pythonenv/repo/links
rm -f /local/pythonenv/install-log.txt

# Make sure paths/etc. are set up
. /etc/profile

cd /local/pythonenv/repo

./make-index.pl

# Inherit from systemwide dir - for now
virtualenv --never-download --no-site-packages /local/pythonenv
. /local/pythonenv/bin/activate

grep -v "#" /local/pythonenv/repo/pkgs-to-install.txt | while read pkg
do
    echo ""
    echo ""
    echo "+ easy_install -i file:///local/pythonenv/repo/links -U $pkg"
    easy_install -i file:///local/pythonenv/repo/links -U $pkg
    echo ""
done 2>&1 | tee -a /local/pythonenv/install-log.txt

# Do this so that systemwide supervisor will use the new version
rm -f /usr/bin/supervisord
rm -f /usr/bin/supervisorctl
ln -sf /local/pythonenv/bin/supervisord /usr/bin/supervisord
ln -sf /local/pythonenv/bin/supervisorctl /usr/bin/supervisorctl

chown -R web:web /local/pythonenv

# If web already installed, run setup
if [ -e /local/web/launch-setup.sh ]; then
su web -c "/local/web/launch-setup.sh"
fi
