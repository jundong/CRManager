import logging
import json
import transaction
from datetime import datetime

from ixiacr.lib.utils import admin_helper
from sqlalchemy.sql import and_
from sqlalchemy.orm.exc import NoResultFound
from ixiacr.lib.utils import get_build_number
from ixiacr.lib.config import get_global_config_options

from ixiacr.models import Update

LOGGER = logging.getLogger(__name__)

MAX_UPDATE_HISTORY = 20

class Updater(object):
    """ Checks for updates and downloads them while updating state in the database for use by the middle-tier
    """
    def __init__(self, db):
        self.db = db

    def download_updates(self):
        LOGGER.info('Starting download...')

        kbytes_per_second_limit = get_global_config_options().get_option_value('system', 'update-kb-rate-limit')
        if kbytes_per_second_limit:
            kbytes_per_second_limit = int(kbytes_per_second_limit)

        args = {'offline': 0}
        if kbytes_per_second_limit:
            args['bandwidth'] = kbytes_per_second_limit
            LOGGER.info('bandwidth specified; kbytes_per_second_limit={0}'.format(kbytes_per_second_limit))

        (result, obj, err) = admin_helper('download-updates', args)

        if result == 'SUCCESS':
            # At this point we have finished the download.
            pass

        else:
            LOGGER.error('download-updates failed: err={0}'.format(err))
            raise Exception('Download failed')


    def check_updates(self, force_offline_check=False):
        offline = False

        if not force_offline_check:
            LOGGER.info('Checking network for updates...')
            (result, obj, err) = admin_helper('list-updates', {'offline': 0})
            if result == 'FAILURE':
                LOGGER.error('Network updated failed. err={0}'.format(err))
                return
        else:
            LOGGER.info('Checking offline for updates...')
            (result, obj, err) = admin_helper('list-updates', {'offline': 1})

            if result == 'FAILURE':
                LOGGER.error('Offline update failed. err={0}'.format(err))
                return
            else:
                offline = True

        packages = obj.get('packages', None)
        available = len(packages)

        if available > 0:
            latest = max([int(v[1].split('-')[1]) for v in packages])

            # Load from database most recent version
            # Is that version same as 'latest'
            #    YES-> do nothing
            #     NO-> update database and proceed with download

            cur_build = get_build_number()

            # If we have updates, we must call download_updates()
            LOGGER.info('Updates are available: current_build: {0} newest_build: {1}'.format(cur_build, latest))

            # Mark any 'unapplied' updates as outdated
            # This leaves applied updates in the history
            updates = self.db.query(Update).order_by(Update.id.desc()).all()
            for pos, update in enumerate(updates):
                if update.state in ['AVAILABLE', 'DOWNLOADING', 'READY']:
                    LOGGER.debug('Marking update state=OUTDATED; id={0}; latest_build={1}; prev_state={2}'.format(
                        update.id, update.latest_build, update.state))
                    update.state = 'OUTDATED'

                if pos >= MAX_UPDATE_HISTORY:
                    LOGGER.debug('Removing old update record; id={0}'.format(update.id))
                    self.db.delete(update)

            # Look for an update matching the current found update build or create it
            terms = [Update.latest_build == str(latest)]
            cur_update = self.db.query(Update).filter(and_(*terms)).first()
            if not cur_update:
                cur_update = Update()
                cur_update.latest_build = latest
                self.db.add(cur_update)

            # Update status to downloading, since we called list-updates
            cur_update.offline = offline
            cur_update.available_updates = available
            cur_update.details = json.dumps({'packages': packages})
            if not cur_update.offline:
                cur_update.state = 'DOWNLOADING'
                cur_update.download_started = datetime.now()
                cur_update.download_finished = None

                self.db.flush()

                self.download_updates()

                self.db.add(cur_update)
                cur_update.download_finished = datetime.now()

                duration = (cur_update.download_finished - cur_update.download_started).seconds
                LOGGER.info('Download completed; secs={0}'.format(duration))

            # Updates are now ready to be applied by admin
            cur_update.state = 'READY'
            transaction.commit()

        else:
            LOGGER.info('Updates are not available')

    def apply_updates(self):
        """ Apply any ready update
        """
        try:
            terms = [Update.state == 'DOWNLOADING']
            downloads = self.db.query(Update).filter(and_(*terms)).first()
            if downloads:
                LOGGER.warn('Download id={0} still in-progress.'.format(downloads.id))
                return 'FAILURE', 'Update download still in-progress'

            terms = [Update.state == 'READY']
            update = self.db.query(Update).filter(and_(*terms)).one()

            # Update applied state in case updates cause restart
            update.state = 'APPLIED'
            update.applied_date = datetime.now()
            self.db.flush()

            args = {
                'background': 1,
                'offline': 1 if update.offline else 0,
                'cacheonly': 1 if not update.offline else 0
            }

            message = None

            LOGGER.info('Applying updates for id={0}; latest_build={1}; args={2}'.format(
                update.id, update.latest_build, str(args)))

            transaction.commit()

            (result, obj, err) = admin_helper('get-updates', args)

            if result == 'SUCCESS':
                LOGGER.info('Apply updates helper succeeded.')
            else:
                LOGGER.error('Apply updates failed. err={0}'.format(err))

            if 'log' in obj:
                message = obj['log']

            return result, message

        except NoResultFound:
            LOGGER.info('No updates to apply.')
            return 'FAILURE', 'No updates to apply.'

        except Exception as e:
            LOGGER.exception(e)

    def get_update_info(self):
        """ Returns information about any available updates.

        :returns: Tuple - (available_updates, newest_build):
            available_updates - 0 or count of packages
            newest_build - None or highest build number available in updates
        """
        terms = [Update.state == 'READY']
        cur_update = self.db.query(Update).filter(and_(*terms)).first()
        if cur_update:
            LOGGER.debug('Updates available; newest_build={0}'.format(cur_update.latest_build))
            return cur_update.available_updates, cur_update.latest_build

        LOGGER.debug('No updates available')
        return 0, None

    def verify_updates(self):
        """ Mark any update records as outdated in case user updated manually.
        """
        try:
            cur_build_num = int(get_build_number())

            updates = self.db.query(Update).filter(Update.state == 'READY')
            for update in updates:
                if cur_build_num >= int(update.latest_build):
                    LOGGER.debug('Marking build={0} as OUTDATED; cur_build={1}'.format(
                        update.latest_build, cur_build_num))
                    update.state = 'OUTDATED'

            transaction.commit()

        except Exception as e:
            LOGGER.exception(e)
